import fs from 'node:fs/promises';
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
import {connectedRegions,maskSummary} from '../shared/report.mjs';
let sessionPromise;
const SIZE=1024, OUTPUT=512;
export const segmentationModel='ClementP U-Net / SE-ResNeXt50 (five public datasets)';
export async function pretrainedSegmentation(buffer){
 sessionPromise??=ort.InferenceSession.create('models/lesions-pretrained/model.onnx',{executionProviders:['cpu'],intraOpNumThreads:2}).catch(e=>{sessionPromise=null;throw e;});
 const session=await sessionPromise;
 // Match upstream autofit: crop black border at 5% of maximum channel value,
 // preserve aspect ratio, pad to 1024, then RGB ImageNet normalization.
 const {data,info}=await sharp(buffer).rotate().toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});
 let maximum=0;for(const v of data)maximum=Math.max(maximum,v);
 let left=info.width,top=info.height,right=0,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){
  const p=(y*info.width+x)*3;
  if(Math.max(data[p],data[p+1],data[p+2])>maximum*.05){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 }
 if(right<=left||bottom<=top)throw new Error('No retinal field available for segmentation');
 const width=right-left,height=bottom-top,scale=SIZE/Math.max(width,height),rw=Math.round(width*scale),rh=Math.round(height*scale),px=Math.floor((SIZE-rw)/2),py=Math.floor((SIZE-rh)/2);
 const rgb=await sharp(data,{raw:{width:info.width,height:info.height,channels:3}}).extract({left,top,width,height}).resize(rw,rh,{kernel:'cubic'}).extend({left:px,right:SIZE-rw-px,top:py,bottom:SIZE-rh-py,background:{r:0,g:0,b:0}}).raw().toBuffer();
 const input=new Float32Array(3*SIZE*SIZE),mean=[.485,.456,.406],std=[.229,.224,.225];
 for(let i=0;i<SIZE*SIZE;i++)for(let c=0;c<3;c++)input[c*SIZE*SIZE+i]=(rgb[i*3+c]/255-mean[c])/std[c];
 const outputs=await session.run({image:new ort.Tensor('float32',input,[1,3,SIZE,SIZE])}),prediction=outputs.logits;
 if(prediction.dims.join(',')!==`1,5,${SIZE},${SIZE}`)throw new Error('Unexpected lesion model output dimensions');
 const logits=prediction.data,plane=SIZE*SIZE;
 // Source channels: background, cotton wool spots, hard exudates, hemorrhages, microaneurysms.
 const codes=['SE','EX','HE','MA'],masks=codes.map(()=>new Uint8Array(OUTPUT*OUTPUT));
 let nonfinite=0;
 for(let y=0;y<OUTPUT;y++)for(let x=0;x<OUTPUT;x++){
  const ox=(x+.5)*info.width/OUTPUT,oy=(y+.5)*info.height/OUTPUT;
  if(ox<left||ox>=right||oy<top||oy>=bottom)continue;
  const sx=Math.min(SIZE-1,Math.max(0,Math.floor(px+(ox-left)*rw/width))),sy=Math.min(SIZE-1,Math.max(0,Math.floor(py+(oy-top)*rh/height))),p=sy*SIZE+sx;
  if(Math.max(rgb[p*3],rgb[p*3+1],rgb[p*3+2])<=maximum*.05)continue;
  let best=0,max=logits[p];for(let c=1;c<5;c++)if(logits[c*plane+p]>max){max=logits[c*plane+p];best=c;}
  let sum=0;for(let c=0;c<5;c++)sum+=Math.exp(logits[c*plane+p]-max);
  if(!Number.isFinite(sum)){nonfinite++;continue;}
  // Conservative default, not a calibrated lesion confidence or tuned clinical threshold.
  if(best>0&&1/sum>=.5)masks[best-1][y*OUTPUT+x]=255;
 }
 if(nonfinite)throw new Error('Non-finite segmentation probabilities');
 const colours={MA:[255,77,89],HE:[255,146,63],EX:[255,224,101],SE:[107,226,138]},result={};
 const png=async(raw,channels)=>'data:image/png;base64,'+(await sharp(Buffer.from(raw),{raw:{width:OUTPUT,height:OUTPUT,channels}}).png().toBuffer()).toString('base64');
 for(let c=0;c<4;c++){
  const code=codes[c],mask=masks[c],rgba=new Uint8Array(OUTPUT*OUTPUT*4);let pixels=0;
  for(let i=0;i<mask.length;i++)if(mask[i]){pixels++;rgba.set([...colours[code],180],i*4);}
  result[code]={mask:await png(mask,1),overlay:await png(rgba,4),pixels,coveragePct:100*pixels/mask.length,regions:connectedRegions(mask,OUTPUT,OUTPUT,{minPixels:2,maxRegions:40}),suppressed:pixels/mask.length>.15};
 }
 const summary=maskSummary(result);
 for(const code of summary.suppressedCodes){result[code].regions=[];result[code].suppressed=true;}
 return {masks:result,segmentationStatus:summary.status,model:segmentationModel,segmentationModelVersion:'clementp-a2cfcb594e48-onnx-v1',segmentationCategories:['MA','HE','EX','SE'],segmentationThreshold:.5,segmentationTransform:{originalWidth:info.width,originalHeight:info.height,crop:{left,top,width,height},resized:{width:rw,height:rh},padding:{left:px,top:py}},warning:'Research AI segmentation. Regions are suspected findings, not confirmed diagnoses. No independent local accuracy validation.'};
}
