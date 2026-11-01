import proto from 'onnx-proto';
import {gradCam} from './domain.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
import {decodeImage} from './glaucoma/server/images.js';
export async function loadBinaryGlaucoma(directory){
 let metadata;
 try{metadata=JSON.parse(await fs.readFile(path.join(directory,'metadata.json'),'utf8'));}catch{return null;}
 if(metadata.architecture!=='netriv-glaucoma-efficientnet-b0-v1')return null;
 const report=JSON.parse(await fs.readFile(path.join(directory,'training-report.json'),'utf8'));
 let testing=null;
 try{testing=JSON.parse(await fs.readFile(path.join(directory,'research-testing.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
 const testOnly=testing?.enabled===true;
 if((!metadata.engineeringGatePassed||!report.engineeringGate?.passed)&&!testOnly)throw new Error('Glaucoma candidate did not pass its held-out engineering checks; activation refused.');

 const bytes=await fs.readFile(path.join(directory,'model.onnx')),hash=crypto.createHash('sha256').update(bytes).digest('hex');
 if(hash!==metadata.modelSha256)throw new Error('Glaucoma model checksum mismatch');
 if(metadata.inputSize!==224||metadata.labels?.length!==2||!Number.isFinite(metadata.threshold)||metadata.threshold<=0||metadata.threshold>=1)throw new Error('Invalid binary glaucoma metadata');
 const session=await ort.InferenceSession.create(bytes,{executionProviders:['cpu'],intraOpNumThreads:2});
 const graph=proto.onnx.ModelProto.decode(bytes).graph;
 const readHead=name=>{const tensor=graph.initializer.find(t=>t.name===name);if(!tensor)throw new Error('Missing glaucoma CAM classifier weights');return tensor.rawData?.length?new Float32Array(Uint8Array.from(tensor.rawData).buffer):Float32Array.from(tensor.floatData);};
 const camWeights=readHead('head.weight'),camBias=readHead('head.bias');
 if(camWeights.length!==2560||camBias.length!==2)throw new Error('Unsupported glaucoma attention head');
 const runtime={
  status(){return {model_loaded:true,heatmap_available:true,researchTestMode:testOnly,model_id:hash.slice(0,16),labels:metadata.labels,threshold:metadata.threshold,clinically_validated:false,endpoint:'binary glaucoma screening; no severity grading',evaluation:{test:report.test,patientBootstrap95CI:report.patientBootstrap95CI,limitations:report.limitations}};},
  async analyze(buffer,eye,confirmed){
   const {quality,image_sha256}=await decodeImage(buffer);
   const base={researchTestMode:testOnly,eye,quality,image_sha256,operator_confirmed_fundus_and_quality:confirmed,model_id:hash.slice(0,16),level:null,label:null,scores:null};
   if(!quality.technical_check_passed)return {...base,status:'recapture',message:'Technical image checks failed; recapture or specialist review required.'};
   if(!confirmed&&!testOnly)return {...base,status:'review_required',message:'A qualified operator must confirm fundus content and optic-disc visibility.'};
   const rgb=await sharp(buffer).rotate().flatten({background:'#000'}).toColourspace('srgb').removeAlpha().resize(224,224,{fit:'contain',background:'#000',kernel:'linear'}).raw().toBuffer();
   const x=new Float32Array(3*224*224),mean=[.485,.456,.406],std=[.229,.224,.225];
   for(let i=0;i<224*224;i++)for(let c=0;c<3;c++)x[c*224*224+i]=(rgb[i*3+c]/255-mean[c])/std[c];
   const result=await session.run({image:new ort.Tensor('float32',x,[1,3,224,224])}),logits=Array.from(result.logits.data);
   if(logits.length!==2||!logits.every(Number.isFinite))throw new Error('Invalid binary glaucoma logits');
   const max=Math.max(...logits),e=logits.map(v=>Math.exp(v-max)),positive=e[1]/(e[0]+e[1]),screeningClass=positive>=metadata.threshold?1:0;
   const activation=result.activation;
   if(!activation||activation.dims.join(',')!=='1,1280,7,7')throw new Error('Unsupported glaucoma activation dimensions');
   for(let cls=0;cls<2;cls++){
    let reconstructed=camBias[cls];for(let c=0;c<1280;c++){let pooled=0;for(let j=0;j<49;j++)pooled+=activation.data[c*49+j]/49;reconstructed+=pooled*camWeights[cls*1280+c];}
    if(Math.abs(reconstructed-logits[cls])>.002)throw new Error('Glaucoma attention weights do not match the classifier output');
   }
   const gradient=Float32Array.from(camWeights.subarray(1280),w=>w/49),attention=gradCam(activation.data,gradient,1280,49,0);
   const padded=await sharp(Buffer.from(Uint8Array.from(attention,v=>Math.round(v*255))),{raw:{width:7,height:7,channels:1}}).resize(224,224,{kernel:'linear'}).greyscale().raw().toBuffer();
   const original=await sharp(buffer).rotate().metadata();
   const inner=await sharp(buffer).rotate().resize(224,224,{fit:'inside',kernel:'linear'}).toBuffer({resolveWithObject:true});
   const box={left:Math.floor((224-inner.info.width)/2),top:Math.floor((224-inner.info.height)/2),width:inner.info.width,height:inner.info.height};
   const unpadded=await sharp(padded,{raw:{width:224,height:224,channels:1}}).extract(box).resize(512,512,{fit:'fill',kernel:'linear'}).greyscale().raw().toBuffer(),rgba=new Uint8Array(512*512*4);
   for(let i=0;i<unpadded.length;i++){const v=unpadded[i]/255;rgba.set([Math.round(255*Math.min(1,v*2)),Math.round(255*(v<.5?v*2:(1-v)*2)),Math.round(255*Math.max(0,1-v*2)),Math.round(v*.75*255)],i*4);}
   const heatmap='data:image/png;base64,'+(await sharp(Buffer.from(rgba),{raw:{width:512,height:512,channels:4}}).png().toBuffer()).toString('base64');
   return {...base,heatmap,heatmapGrid:[7,7],heatmapHasSignal:attention.some(v=>v>0),heatmapMethod:'Grad-CAM of glaucoma-suspected logit using exact linear-head gradients; inverse letterbox alignment; not lesion segmentation.',imageSize:{width:original.width,height:original.height},status:'research_prediction',endpoint:'binary glaucoma screening',screening_class:screeningClass,label:metadata.labels[screeningClass],threshold:metadata.threshold,scores:metadata.labels.map((label,i)=>({level:i,label,score:i?positive:1-positive})),message:'Research-only glaucoma screening. Scores are uncalibrated. This is not a diagnosis or severity stage; a lower score does not rule out glaucoma.'};
  }
 };

 return runtime;
}
