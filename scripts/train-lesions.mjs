import * as tf from '@tensorflow/tfjs';
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
await tf.setBackend('cpu');
const size=48, patches=[], labels=[];
let seed=14;
const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
// Each source image remains in its original split. Only train images 01-06 are fitted.
// 07-08 are held out for this small development experiment. This is not the official test evaluation.
async function collect(n, count) {
  const id=`IDRiD_${String(n).padStart(2,'0')}`;
  const {data:rgb,info}=await sharp(`data/training/${id}.jpg`).resize(1024).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const masks=await Promise.all(['MA','HE','EX'].map(async code=>{
    const {data}=await sharp(`data/training/${id}_${code}.tif`).resize(info.width,info.height,{kernel:'nearest'}).greyscale().raw().toBuffer({resolveWithObject:true});return data;
  }));
  const positives=[[],[],[]];
  for(let k=0;k<3;k++) for(let p=0;p<masks[k].length;p++) if(masks[k][p]>0) positives[k].push(p);
  const xs=[],ys=[];
  for(let p=0;p<count;p++) {
    const k=p%4;
    const center=k<3 && positives[k].length ? positives[k][Math.floor(rand()*positives[k].length)] : Math.floor(rand()*info.width*info.height);
    const x0=Math.max(0,Math.min(info.width-size,center%info.width-Math.floor(rand()*size)));
    const y0=Math.max(0,Math.min(info.height-size,Math.floor(center/info.width)-Math.floor(rand()*size)));
    const x=new Float32Array(size*size*3),y=new Float32Array(size*size*3);
    for(let py=0;py<size;py++) for(let px=0;px<size;px++) {
      const src=(y0+py)*info.width+x0+px,dst=(py*size+px)*3;
      for(let c=0;c<3;c++){x[dst+c]=rgb[src*3+c]/255;y[dst+c]=masks[c][src]>0?1:0;}
    }
    xs.push(x);ys.push(y);
  }
  return {xs,ys};
}
for(let n=1;n<=6;n++){const v=await collect(n,20);patches.push(...v.xs);labels.push(...v.ys);}
const validX=[],validY=[];
for(let n=7;n<=8;n++){const v=await collect(n,12);validX.push(...v.xs);validY.push(...v.ys);}
const input=tf.input({shape:[null,null,3]});
const conv=(x,f)=>tf.layers.conv2d({filters:f,kernelSize:3,padding:'same',activation:'relu',kernelInitializer:tf.initializers.glorotUniform({seed:14})}).apply(x);
const a=conv(input,4),b=conv(tf.layers.maxPooling2d({poolSize:[2,2]}).apply(a),8);
const c=conv(tf.layers.maxPooling2d({poolSize:[2,2]}).apply(b),12);
const d=conv(tf.layers.concatenate().apply([tf.layers.upSampling2d({size:[2,2]}).apply(c),b]),8);
const e=conv(tf.layers.concatenate().apply([tf.layers.upSampling2d({size:[2,2]}).apply(d),a]),4);
const output=tf.layers.conv2d({filters:3,kernelSize:1,padding:'same',activation:'sigmoid'}).apply(e);
const model=tf.model({inputs:input,outputs:output});
function loss(y,p){return tf.tidy(()=>{
  const eps=1e-6;
  const positive=y.mul(p.add(eps).log()).mul(tf.tensor1d([12,6,5]));
  const negative=tf.scalar(1).sub(y).mul(tf.scalar(1).sub(p).add(eps).log());
  return positive.add(negative).neg().mean();
});}
model.compile({optimizer:tf.train.adam(0.003),loss});
const tensor=(v)=>tf.tensor4d(Float32Array.from(v.flatMap(a=>Array.from(a))),[v.length,size,size,3]);
const x=tensor(patches),y=tensor(labels),vx=tensor(validX),vy=tensor(validY);
const epochs=Number(process.env.TRAIN_EPOCHS||8);
await model.fit(x,y,{epochs,batchSize:8,shuffle:false,validationData:[vx,vy],callbacks:{onEpochEnd:(i,l)=>console.log(`Lesion epoch ${i+1}/${epochs}: loss=${l.loss.toFixed(4)} val_loss=${l.val_loss.toFixed(4)}`)}});
const pred=model.predict(vx),p=await pred.data(),gt=await vy.data();
const metrics={};
for(let k=0;k<3;k++){
  let tp=0,fp=0,fn=0;
  for(let i=k;i<p.length;i+=3){if(p[i]>=0.5 && gt[i])tp++;else if(p[i]>=0.5)fp++;else if(gt[i])fn++;}
  metrics[['MA','HE','EX'][k]]={dice:2*tp/(2*tp+fp+fn||1),tp,fp,fn};
}
await fs.mkdir('models/lesions',{recursive:true});
await model.save(tf.io.withSaveHandler(async artifact=>{
  await fs.writeFile('models/lesions/model.json',JSON.stringify({modelTopology:artifact.modelTopology,weightsManifest:[{paths:['weights.bin'],weights:artifact.weightSpecs}]}));
  await fs.writeFile('models/lesions/weights.bin',Buffer.from(artifact.weightData));
  return {modelArtifactsInfo:{dateSaved:new Date(),modelTopologyType:'JSON'}};
}));
await fs.writeFile('models/lesions/training.json',JSON.stringify({architecture:'Tiny U-Net, TensorFlow.js CPU',
  trainImages:[1,2,3,4,5,6],validationImages:[7,8],source:'IDRiD (CC BY 4.0)',
  input:'RGB / 255; source resized to width 1024; 48x48 lesion-balanced patches',
  trainPatches:patches.length,validationPatches:validX.length,epochs,threshold:0.5,metrics,
  limitations:'Very small demonstration baseline. Metrics are on lesion-balanced validation patches, not full images or clinical evaluation. Tiny microaneurysm performance is limited. All outputs need review.'},null,2));
console.log(JSON.stringify(metrics));
tf.dispose([x,y,vx,vy,pred]);
await import('./calibrate-lesions.mjs');
