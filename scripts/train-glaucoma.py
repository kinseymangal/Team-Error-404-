"""Patient-separated PAPILA binary research training; never deploys automatically.
Requires torch, torchvision, numpy, pillow, onnx. Prepare images with the companion
Node script so serving and training use identical Sharp image preprocessing.
"""
import argparse,collections,copy,hashlib,json,random,time,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
import numpy as np
from PIL import Image
import torch
from torch import nn
from torchvision import models,transforms
from torch.utils.data import Dataset,DataLoader

def clinical(file,side):
 ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
 with zipfile.ZipFile(file) as z:
  strings=[''.join(x.itertext()) for x in ET.fromstring(z.read('xl/sharedStrings.xml'))]
  rows=[]
  for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//m:row',ns):
   cells={}
   for c in row:
    v=c.find('m:v',ns)
    if v is not None:cells[''.join(x for x in c.attrib['r'] if x.isalpha())]=strings[int(v.text)] if c.attrib.get('t')=='s' else v.text
   if cells.get('A','').startswith('#') and cells.get('D') in ['0','1','2']:
    patient=cells['A'].lstrip('#').zfill(3);rows.append({'id':'RET'+patient+side,'patient':patient,'label':int(cells['D'])})
  return rows

def metrics(y,p,threshold=.5):
 y=y.detach().cpu().numpy() if isinstance(y,torch.Tensor) else np.asarray(y);p=np.asarray(p);pred=p>=threshold;tp=int(((y==1)&pred).sum());tn=int(((y==0)&~pred).sum());fp=int(((y==0)&pred).sum());fn=int(((y==1)&~pred).sum())
 sensitivity=tp/max(1,tp+fn);specificity=tn/max(1,tn+fp);precision=tp/max(1,tp+fp);f1=2*tp/max(1,2*tp+fp+fn);f0=2*tn/max(1,2*tn+fp+fn)
 pos=p[y==1];neg=p[y==0];auc=float(((pos[:,None]>neg).sum()+.5*(pos[:,None]==neg).sum())/(len(pos)*len(neg))) if len(pos)*len(neg) else None
 return dict(images=len(y),support={'healthy':int((y==0).sum()),'glaucoma':int((y==1).sum())},threshold=float(threshold),accuracy=(tp+tn)/max(1,len(y)),sensitivity=sensitivity,specificity=specificity,precision=precision,macroF1=(f1+f0)/2,balancedAccuracy=(sensitivity+specificity)/2,auroc=auc,confusionMatrix=[[tn,fp],[fn,tp]])

def operating_point(y,p):
 values=np.unique(np.asarray(p));thresholds=np.unique(np.r_[0.,(values[:-1]+values[1:])/2,1.]);choices=[metrics(y,p,t)for t in thresholds]
 eligible=[m for m in choices if m['sensitivity']>=.8]
 return max(eligible,key=lambda m:(m['specificity'],m['balancedAccuracy'])) if eligible else max(choices,key=lambda m:m['balancedAccuracy'])

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--dataset',required=True);ap.add_argument('--cache',required=True);ap.add_argument('--imagenet-weights',required=True);ap.add_argument('--output',required=True);ap.add_argument('--epochs',type=int,default=12);args=ap.parse_args()
 torch.set_num_threads(4);torch.manual_seed(2026);np.random.seed(2026);random.seed(2026)
 data=Path(args.dataset);cache=Path(args.cache);out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
 rows=clinical(data/'patient_data_od.xlsx','OD')+clinical(data/'patient_data_os.xlsx','OS');rows.sort(key=lambda r:r['id'])
 assert len(rows)==488,'Incomplete labels'
 parent={r['patient']:r['patient']for r in rows}
 def find(a):
  while parent[a]!=a:parent[a]=parent[parent[a]];a=parent[a]
  return a
 fingerprints={}
 for r in rows:
  raw=(data/(r['id']+'.jpg')).read_bytes();r['sha256']=hashlib.sha256(raw).hexdigest()
  with Image.open(cache/(r['id']+'.png'))as image:pixels=np.asarray(image.convert('RGB'));r['pixelSha256']=hashlib.sha256(pixels.tobytes()).hexdigest()
  for fingerprint in [r['sha256'],r['pixelSha256']]:
   if fingerprint in fingerprints:parent[find(r['patient'])]=find(fingerprints[fingerprint])
   fingerprints[fingerprint]=r['patient']
 groups=collections.defaultdict(list)
 for r in rows:groups[find(r['patient'])].append(r)
 strata=collections.defaultdict(list)
 for group,items in groups.items():strata[tuple(sorted(set(r['label']for r in items)))].append(group)
 split={k:[]for k in ['train','validation','test']};rng=random.Random(2026)
 for ids in strata.values():
  rng.shuffle(ids);n=len(ids);a=round(.6*n);b=round(.8*n)
  for name,subset in zip(split,[ids[:a],ids[a:b],ids[b:]]):
   for group in subset:split[name].extend(groups[group])
 for name,items in split.items():
  for r in items:r['split']=name
  print(name,'patients',len({r['patient']for r in items}),'labels',dict(collections.Counter(r['label']for r in items)),flush=True)
 audit={'source':'PAPILA Figshare 14798004 v2, GPL-3.0+','splitSeed':2026,'splits':split,'suspectPolicy':'Label 2 excluded from binary training and primary evaluation; never relabeled healthy.','clinicalVariablesUsed':False,'expertContoursUsed':False,'limitations':['Single Spanish cohort; no independent-site validation.','Small test cohort; estimates have wide uncertainty.','Patient-separated splits plus exact file/decoded-pixel duplicate grouping; transformed duplicates not comprehensively excluded.']}
 (out/'dataset-audit.json').write_text(json.dumps(audit,indent=2))
 binary={k:[r for r in v if r['label']in [0,1]]for k,v in split.items()}
 plain=transforms.Compose([transforms.ToTensor(),transforms.Normalize([.485,.456,.406],[.229,.224,.225])])
 augment=transforms.Compose([transforms.RandomHorizontalFlip(),transforms.RandomRotation(8),transforms.ColorJitter(brightness=.05,contrast=.05),plain])
 class Images(Dataset):
  def __init__(self,items,aug=False):self.rows=items;self.transform=augment if aug else plain
  def __len__(self):return len(self.rows)
  def __getitem__(self,i):
   r=self.rows[i]
   with Image.open(cache/(r['id']+'.png')) as im:x=self.transform(im.convert('RGB'))
   return x,r['label']
 loaders={k:DataLoader(Images(v,k=='train'),batch_size=24,shuffle=k=='train')for k,v in binary.items()}
 net=models.efficientnet_b0(weights=None);net.load_state_dict(torch.load(args.imagenet_weights,weights_only=True));net.classifier=nn.Linear(1280,2)
 # First fit regularized heads on frozen ImageNet features, then fine-tune later visual blocks.
 net.eval();features={}
 with torch.inference_mode():
  for name,items in binary.items():
   features[name]=torch.cat([net.features(x).mean((2,3))for x,y in DataLoader(Images(items),batch_size=24)])
 labels={k:torch.tensor([r['label']for r in v])for k,v in binary.items()}
 mean=features['train'].mean(0);std=features['train'].std(0).clamp_min(.1);normalized={k:(v-mean)/std for k,v in features.items()}
 counts=torch.bincount(labels['train'],minlength=2);weights=(len(labels['train'])/(2*counts.float())).sqrt();best=-1;beststate=None;history=[]
 for decay in [.01,.1,1.]:
  torch.manual_seed(2026);head=nn.Linear(1280,2);opt=torch.optim.AdamW(head.parameters(),lr=.005,weight_decay=decay);lossfn=nn.CrossEntropyLoss(weight=weights)
  for epoch in range(100):
   opt.zero_grad();loss=lossfn(head(normalized['train']),labels['train']);loss.backward();opt.step()
   if epoch%5==0:
    with torch.no_grad():p=head(normalized['validation']).softmax(1)[:,1].numpy()
    m=operating_point(labels['validation'],p);score=.5*m['balancedAccuracy']+.5*(m['auroc']or 0)
    if score>best:
     best=score;state=copy.deepcopy(head.state_dict());state['weight']=state['weight']/std[None,:];state['bias']=state['bias']-(state['weight']*mean).sum(1);net.classifier.load_state_dict(state);beststate=copy.deepcopy(net.state_dict());selected={'method':'frozen ImageNet features / linear head','decay':decay,'epoch':epoch+1,'validation':m}
 print('Selected head validation',json.dumps(selected),flush=True)
 net.load_state_dict(beststate)
 for param in net.features[:6].parameters():param.requires_grad=False
 opt=torch.optim.AdamW([{'params':[p for p in net.features.parameters()if p.requires_grad],'lr':.000025},{'params':net.classifier.parameters(),'lr':.0001}],weight_decay=.01);criterion=nn.CrossEntropyLoss(weight=weights,label_smoothing=.02)
 def infer(loader):
  net.eval();prob=[]
  with torch.inference_mode():
   for x,y in loader:prob.extend(net(x).softmax(1)[:,1].tolist())
  return np.array(prob)
 for epoch in range(args.epochs):
  net.train();net.features.eval();losses=[]
  for x,y in loaders['train']:
   opt.zero_grad();loss=criterion(net(x),y);loss.backward();nn.utils.clip_grad_norm_([p for p in net.parameters()if p.requires_grad],3);opt.step();losses.append(float(loss.detach()))
  m=operating_point(labels['validation'],infer(loaders['validation']));score=.5*m['balancedAccuracy']+.5*(m['auroc']or 0);history.append({'epoch':epoch+1,'loss':float(np.mean(losses)),'validation':m})
  if score>best:best=score;beststate=copy.deepcopy(net.state_dict());selected={'method':'later-block fine-tuning','epoch':epoch+1,'validation':m}
  (out/'progress.json').write_text(json.dumps({'completedEpochs':epoch+1,'totalEpochs':args.epochs,'selected':selected,'history':history},indent=2));print('Glaucoma fine-tune',epoch+1,'/',args.epochs,json.dumps(m),flush=True)
 net.load_state_dict(beststate);net.eval();threshold=selected['validation']['threshold'];prob=infer(loaders['test']);test=metrics(labels['test'],prob,threshold)
 # Predeclared engineering gate; passing is not clinical validation.
 gate=test['sensitivity']>=.8 and test['specificity']>=.7 and (test['auroc']or 0)>=.75 and min(test['support'].values())>=10
 rng=np.random.default_rng(2026);testrows=binary['test'];patients=sorted({r['patient']for r in testrows});boots=[]
 for _ in range(1000):
  sample=rng.choice(patients,len(patients),replace=True);ix=[i for patient in sample for i,r in enumerate(testrows)if r['patient']==patient]
  if len(set(labels['test'][ix].tolist()))==2:boots.append(metrics(labels['test'][ix],prob[ix],threshold))
 intervals={k:np.quantile([b[k]for b in boots],[.025,.975]).tolist()for k in ['sensitivity','specificity','auroc','accuracy']}
 report={'splitCounts':{k:{'images':len(v),'patients':len(set(r['patient']for r in v)),'binaryImages':len(binary[k])}for k,v in split.items()},'status':'completed','endpoint':'Binary glaucoma vs healthy reference labels; excludes suspects','architecture':'EfficientNet-B0 ImageNet initialization; binary supervised head and later-block fine-tuning','selected':selected,'history':history,'test':test,'patientBootstrap95CI':intervals,'engineeringGate':{'passed':bool(gate),'requirements':'Held-out sensitivity>=0.80, specificity>=0.70, AUROC>=0.75, >=10 images per reference class. Not a clinical approval.'},'clinicalValidation':False,'calibrated':False,'activeModelChanged':False,'limitations':audit['limitations']}
 (out/'training-report.json').write_text(json.dumps(report,indent=2));(out/'test-predictions.json').write_text(json.dumps([{'id':r['id'],'patient':r['patient'],'actual':r['label'],'score':float(p)}for r,p in zip(testrows,prob)],indent=2));torch.save(net.state_dict(),out/'weights.pth')
 class Export(nn.Module):
  def __init__(self,model):super().__init__();self.features=model.features;self.head=model.classifier
  def forward(self,x):a=self.features(x);return self.head(a.mean((2,3))),a
 export=Export(net).eval();torch.onnx.export(export,torch.zeros(1,3,224,224),str(out/'model.onnx'),input_names=['image'],output_names=['logits','activation'],opset_version=17,dynamo=False)
 (out/'metadata.json').write_text(json.dumps({'architecture':'netriv-glaucoma-efficientnet-b0-v1','inputSize':224,'labels':['Lower model suspicion','Glaucoma suspected'],'threshold':threshold,'preprocessing':'Sharp sRGB RGB, contain 224 black padding, linear, ImageNet mean/std','modelSha256':hashlib.sha256((out/'model.onnx').read_bytes()).hexdigest(),'clinicalValidation':False,'engineeringGatePassed':bool(gate)},indent=2))
 print('COMPLETED',json.dumps(test),'engineering gate passed',gate,flush=True)

if __name__=='__main__':main()
