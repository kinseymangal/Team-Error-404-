import {pretrainedSegmentation,segmentationModel} from './pretrained-segmentation.mjs';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
import * as tf from '@tensorflow/tfjs';
import {connectedRegions,maskSummary} from '../shared/report.mjs';
import {softmax,gradCam,gradeNames} from './domain.mjs';
let grader,camMeta,head,lesionModel,training,validationCache;
export async function learningFeatures(buffer){
  await loadGrader();
  const rgb=await sharp(buffer).rotate().resize(224,224,{fit:'fill',kernel:'cubic'}).removeAlpha().raw().toBuffer();
  const input=new Float32Array(3*224*224),mean=[.485,.456,.406],std=[.229,.224,.225];
  for(let p=0;p<224*224;p++)for(let c=0;c<3;c++)input[c*224*224+p]=(rgb[p*3+c]/255-mean[c])/std[c];
  const out=await grader.run({[grader.inputNames[0]]:new ort.Tensor('float32',input,[1,3,224,224])});
  return {features:Array.from(out.getitem_162.data),logits:Array.from(out.output.data),weights:Array.from(tensor('fc.8.weight')),bias:Array.from(tensor('fc.8.bias'))};
}
export async function modelStatus(){
  const exists=async p=>{try{await fs.access(p);return true;}catch{return false;}};
  let validation={status:'not-evaluated',clinicalValidation:false};
  try{
    const paths=['models/evaluation/validation.json','models/grader.onnx','models/lesions-pretrained/model.onnx'];
    const signature=(await Promise.all(paths.map(p=>fs.stat(p)))).map(s=>s.size+':'+s.mtimeMs).join('|');
    if(validationCache?.signature===signature)validation=validationCache.value;
    else {
    const report=JSON.parse(await fs.readFile(paths[0],'utf8'));
    const gradingHash=crypto.createHash('sha256').update(await fs.readFile('models/grader.onnx')).digest('hex');
    const segmentationHash=crypto.createHash('sha256').update(await fs.readFile('models/lesions-pretrained/model.onnx')).digest('hex');
    const weightsMatch=gradingHash===report.grading.sha256&&segmentationHash===report.segmentation.sha256;
    validation={status:weightsMatch?report.status:'weights-changed-re-evaluation-required',weightsMatch,clinicalValidation:false,independentValidation:false,trainingComplete:report.training.completed,replacementActivated:report.training.replacementActivated,selection:report.selection};
    validationCache={signature,value:validation};
    }
  }catch{}
  return {grading:await exists('models/grader.onnx'),segmentation:await exists('models/lesions-pretrained/model.onnx'),gradingModel:'ResNet50 / APTOS research weights',segmentationModel,calibrated:false,clinicalValidation:false,validation};
}
async function loadGrader(){
  if(!grader){
    grader=await ort.InferenceSession.create('models/grader.onnx',{executionProviders:['cpu'],intraOpNumThreads:2});
    camMeta=JSON.parse(await fs.readFile('models/cam.json','utf8'));
    const b=await fs.readFile('models/cam-head.bin');head=new Float32Array(Uint8Array.from(b).buffer);
  }
}
async function loadLesions(){
  if(!lesionModel){
    await tf.setBackend('cpu');
    const json=JSON.parse(await fs.readFile('models/lesions/model.json','utf8')),weights=await fs.readFile('models/lesions/weights.bin');
    lesionModel=await tf.loadLayersModel(tf.io.fromMemory({modelTopology:json.modelTopology,weightSpecs:json.weightsManifest[0].weights,weightData:Uint8Array.from(weights).buffer}));
    training=JSON.parse(await fs.readFile('models/lesions/training.json','utf8'));
  }
}
export async function quality(buffer){
  const meta=await sharp(buffer,{limitInputPixels:40000000}).metadata();
  if(!['jpeg','png','webp'].includes(meta.format))throw Object.assign(new Error('Upload JPEG, PNG or WebP photographs.'),{status:400});
  const {data,info}=await sharp(buffer).rotate().resize(256,256,{fit:'fill'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
  let count=0,total=0,totalR=0,totalG=0,lap=0,lap2=0;
  const g=(x,y)=>data[(y*256+x)*info.channels+1];
  for(let y=8;y<248;y++)for(let x=8;x<248;x++){
    if((x-128)**2+(y-128)**2>110**2)continue;
    const i=(y*256+x)*info.channels,green=data[i+1];if(green<12)continue;
    count++;total+=green;totalR+=data[i];totalG+=green;
    const l=4*green-g(x-1,y)-g(x+1,y)-g(x,y-1)-g(x,y+1);lap+=l;lap2+=l*l;
  }
  const brightness=total/(count||1),sharpness=lap2/(count||1)-(lap/(count||1))**2,coverage=count/(Math.PI*110**2),reasons=[];
  if(Math.min(meta.width,meta.height)<224)reasons.push('Image resolution is too low.');
  if(coverage<0.4)reasons.push('Retinal field is too dark or incomplete.');
  if(brightness<22)reasons.push('Image is underexposed.');
  if(brightness>225)reasons.push('Image is overexposed.');
  if(sharpness<18)reasons.push('Image appears blurred. Refocus and retake.');
  if(totalR/(totalG||1)<1.05)reasons.push('Image does not pass the basic fundus colour check.');
  return {accepted:!reasons.length,reasons,sharpness:Math.round(sharpness),brightness:Math.round(brightness),coverage:Math.round(coverage*100),method:'Uncalibrated image-quality heuristics.'};
}
function tensor(name){const s=camMeta.tensors[name];return head.subarray(s.offset,s.offset+s.length);}
function transposeMultiply(w,rows,cols,v){const out=new Float32Array(cols);for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)out[c]+=w[r*cols+c]*v[r];return out;}
export function headGradient(grade,linear0,linear1){
  let d=Float32Array.from(tensor('fc.8.weight').subarray(grade*512,(grade+1)*512));
  const s6=tensor('fc.6.weight'),v6=tensor('fc.6.running_var');
  for(let i=0;i<512;i++)d[i]*=linear1[i]>0?s6[i]/Math.sqrt(v6[i]+camMeta.epsilon):0;
  d=transposeMultiply(tensor('fc.4.weight'),512,1024,d);
  const s2=tensor('fc.2.weight'),v2=tensor('fc.2.running_var');
  for(let i=0;i<1024;i++)d[i]*=linear0[i]>0?s2[i]/Math.sqrt(v2[i]+camMeta.epsilon):0;
  return transposeMultiply(tensor('fc.0.weight'),1024,2048,d);
}
async function png(raw,w,h,channels){return 'data:image/png;base64,'+(await sharp(Buffer.from(raw),{raw:{width:w,height:h,channels}}).png().toBuffer()).toString('base64');}
async function segmentation(buffer){
  await loadLesions();const size=512;
  const data=await sharp(buffer).rotate().resize(size,size,{fit:'fill'}).removeAlpha().raw().toBuffer();
  const masks=Array.from({length:3},()=>new Uint8Array(size*size));
  const stride=96,pad=16,tile=128;
  for(let y=0;y<size;y+=stride)for(let x=0;x<size;x+=stride){
    const input=new Float32Array(tile*tile*3);
    for(let ty=0;ty<tile;ty++)for(let tx=0;tx<tile;tx++){
      const sy=Math.max(0,Math.min(size-1,y+ty-pad)),sx=Math.max(0,Math.min(size-1,x+tx-pad));
      for(let c=0;c<3;c++)input[(ty*tile+tx)*3+c]=data[(sy*size+sx)*3+c]/255;
    }
    const t=tf.tensor4d(input,[1,tile,tile,3]),pred=lesionModel.predict(t),values=await pred.data();
    for(let dy=0;dy<stride&&y+dy<size;dy++)for(let dx=0;dx<stride&&x+dx<size;dx++){
      const dst=(y+dy)*size+x+dx,src=((dy+pad)*tile+dx+pad)*3;
      if(data[dst*3]+data[dst*3+1]+data[dst*3+2]<45)continue;
      for(let c=0;c<3;c++)masks[c][dst]=values[src+c]>=(training.thresholds?.[['MA','HE','EX'][c]]??0.5)?255:0;
    }
    tf.dispose([t,pred]);
  }
  const result={};
  for(let c=0;c<3;c++){
    const code=['MA','HE','EX'][c],colour=[[255,77,89],[255,146,63],[255,224,101]][c],rgba=new Uint8Array(size*size*4);
    let count=0;for(let i=0;i<size*size;i++)if(masks[c][i]){count++;rgba.set([...colour,180],i*4);}
    result[code]={mask:await png(masks[c],size,size,1),overlay:await png(rgba,size,size,4),pixels:count,coveragePct:Number((100*count/(size*size)).toFixed(3)),regions:count/(size*size)<=.15?connectedRegions(masks[c],size,size):[],suppressed:count/(size*size)>.15};
  }
  const summary=maskSummary(result);
  if(summary.rejected)for(const mask of Object.values(result)){mask.regions=[];mask.suppressed=true;}
  return {masks:result,segmentationStatus:summary.status,model:training.architecture,warning:training.limitations};
}
let pending=Promise.resolve();
export function analyze(buffer){const job=pending.then(()=>run(buffer));pending=job.catch(()=>{});return job;}
async function run(buffer){
  const start=Date.now(),q=await quality(buffer),meta=await sharp(buffer).metadata();
  const imageSize={width:meta.width,height:meta.height};
  if(!q.accepted)return {status:'retake',quality:q,grade:null,reviewRequired:true,imageSize};
  const status=await modelStatus();
  if(!status.grading)throw Object.assign(new Error('Grading weights missing. Run npm run setup.'),{status:503});
  await loadGrader();
  const rgb=await sharp(buffer).rotate().resize(224,224,{fit:'fill',kernel:'cubic'}).removeAlpha().raw().toBuffer();
  const input=new Float32Array(3*224*224),mean=[.485,.456,.406],std=[.229,.224,.225];
  for(let p=0;p<224*224;p++)for(let c=0;c<3;c++)input[c*224*224+p]=(rgb[p*3+c]/255-mean[c])/std[c];
  const out=await grader.run({[grader.inputNames[0]]:new ort.Tensor('float32',input,[1,3,224,224])});
  const logits=Array.from(out.output.data);
  if(logits.length!==5||!logits.every(Number.isFinite))throw new Error('Grader must return five finite class logits.');
  const probabilities=softmax(logits),grade=probabilities.indexOf(Math.max(...probabilities));
  const gradient=headGradient(grade,out.linear.data,out.linear_1.data);
  const heat=gradCam(out.relu_48.data,gradient,2048,49,0);
  const gray=Uint8Array.from(heat,x=>Math.round(x*255));
  const resized=await sharp(Buffer.from(gray),{raw:{width:7,height:7,channels:1}}).resize(224,224,{kernel:'cubic'}).greyscale().raw().toBuffer();
  if(resized.length!==224*224)throw new Error('Unexpected heatmap channel layout');
  const rgba=new Uint8Array(224*224*4);
  for(let i=0;i<224*224;i++)if(rgb[i*3]+rgb[i*3+1]+rgb[i*3+2]>45){const v=resized[i]/255;rgba.set([Math.round(255*Math.min(1,2*v)),Math.round(255*(v<.5?2*v:2*(1-v))),Math.round(255*Math.max(0,1-2*v)),Math.round((.15+.65*v)*255)],i*4);}
  const lesions=status.segmentation?await pretrainedSegmentation(buffer):{masks:{},segmentationStatus:'unavailable',warning:'Pretrained lesion model missing: restore models/lesions-pretrained/model.onnx from the complete archive.'};
  return {status:'analyzed',imageSha256:crypto.createHash('sha256').update(buffer).digest('hex'),confidence:Math.max(...probabilities),confidenceKind:'Uncalibrated maximum softmax score',imageSize,heatmapGrid:[7,7],heatmapHasSignal:heat.some(v=>v>0),grade,gradeName:gradeNames[grade],probabilities,uncertain:Math.max(...probabilities)<0.75,reviewRequired:true,quality:q,
    heatmap:await png(rgba,224,224,4),heatmapMethod:'Grad-CAM for predicted logit; analytical gradients through classifier head.',
    ...lesions,elapsedMs:Date.now()-start,modelVersion:'iris-904babc + clementp-a2cfcb / reporting-v4',disclaimer:'Research output requiring doctor review. Scores are not calibrated confidence.'};
}
