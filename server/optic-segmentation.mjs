import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
let session,metadata;
export async function opticModelStatus(){
 try{const m=JSON.parse(await fs.readFile('models/optic-disc/metadata.json','utf8'));return {available:m.discEnabled===true,supportedStructures:m.discEnabled?['disc']:[],cupEnabled:false,evaluation:m.evaluation};}catch{return {available:false,supportedStructures:[],cupEnabled:false};}
}
export async function predictOpticLabels(buffer,directory='models/optic-disc'){
 if(!session){
  metadata=JSON.parse(await fs.readFile(path.join(directory,'metadata.json'),'utf8'));
  const bytes=await fs.readFile(path.join(directory,'model.onnx'));
  if(crypto.createHash('sha256').update(bytes).digest('hex')!==metadata.sha256)throw new Error('Optic model checksum mismatch');
  session=await ort.InferenceSession.create(bytes,{executionProviders:['cpu'],intraOpNumThreads:2});
 }
 const rgb=await sharp(buffer).rotate().flatten({background:'#000'}).toColourspace('srgb').removeAlpha().resize(512,512,{fit:'fill',kernel:'linear'}).raw().toBuffer();
 const x=new Float32Array(512*512*3),mean=[.485,.456,.406],std=[.229,.224,.225];
 for(let i=0;i<512*512;i++)for(let c=0;c<3;c++)x[c*512*512+i]=(rgb[i*3+c]/255-mean[c])/std[c];
 const out=await session.run({image:new ort.Tensor('float32',x,[1,3,512,512])}),logits=out.logits;
 if(logits.dims.join(',')!=='1,3,512,512')throw new Error('Unexpected optic model output');
 const labels=new Uint8Array(512*512);
 for(let i=0;i<labels.length;i++){let best=0;for(let c=1;c<3;c++)if(logits.data[c*labels.length+i]>logits.data[best*labels.length+i])best=c;labels[i]=best;}
 return {labels,metadata};
}
export async function segmentOpticDisc(buffer){
 const status=await opticModelStatus();if(!status.available)return {status:'unavailable',masks:{},cupStatus:'unavailable'};
 const {labels,metadata}=await predictOpticLabels(buffer),mask=new Uint8Array(labels.length),rgba=new Uint8Array(labels.length*4);let count=0,left=512,right=0,top=512,bottom=0;
 for(let i=0;i<labels.length;i++)if(labels[i]>0){mask[i]=255;rgba.set([56,189,248,150],i*4);count++;left=Math.min(left,i%512);right=Math.max(right,i%512);top=Math.min(top,Math.floor(i/512));bottom=Math.max(bottom,Math.floor(i/512));}
 const coverage=count/labels.length;
 if(coverage<.002||coverage>.15)return {status:'unreliable',masks:{},cupStatus:'withheld',warning:'Optic-disc prediction failed the size sanity check. No anatomical mask is displayed.'};
 const png=async(b,channels)=>'data:image/png;base64,'+(await sharp(Buffer.from(b),{raw:{width:512,height:512,channels}}).png().toBuffer()).toString('base64');
 return {status:'experimental-disc-only',modelId:metadata.sha256.slice(0,16),clinicalValidation:false,cupStatus:'withheld-low-validation-dice',masks:{disc:{mask:await png(mask,1),overlay:await png(rgba,4),pixels:count,box:{x:left/512,y:top/512,width:(right-left+1)/512,height:(bottom-top+1)/512}}},warning:'Predicted optic-disc anatomy only; not a glaucoma damage mask. Cup masks are withheld because evaluation was inadequate. No cup-to-disc ratio is estimated.'};
}
