import fs from 'node:fs/promises';
import sharp from 'sharp';
import * as tf from '@tensorflow/tfjs';
const json=JSON.parse(await fs.readFile('models/lesions/model.json','utf8')),b=await fs.readFile('models/lesions/weights.bin');
const model=await tf.loadLayersModel(tf.io.fromMemory({modelTopology:json.modelTopology,weightSpecs:json.weightsManifest[0].weights,weightData:Uint8Array.from(b).buffer}));
const xs=[],ys=[],size=48;
for(let n=7;n<=8;n++){
  const id=`IDRiD_${String(n).padStart(2,'0')}`,{data:rgb,info}=await sharp(`data/training/${id}.jpg`).resize(1024).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const masks=await Promise.all(['MA','HE','EX'].map(c=>sharp(`data/training/${id}_${c}.tif`).resize(info.width,info.height,{kernel:'nearest'}).greyscale().raw().toBuffer()));
  for(let k=0;k<3;k++){
    const positive=[];for(let i=0;i<masks[k].length;i++)if(masks[k][i])positive.push(i);
    for(let j=0;j<8;j++){
      const center=positive[Math.floor((j+.5)*positive.length/8)]||Math.floor(info.width*info.height/2);
      const x0=Math.max(0,Math.min(info.width-size,center%info.width-24)),y0=Math.max(0,Math.min(info.height-size,Math.floor(center/info.width)-24));
      const x=new Float32Array(size*size*3),y=new Float32Array(size*size*3);
      for(let py=0;py<size;py++)for(let px=0;px<size;px++)for(let c=0;c<3;c++){const src=(y0+py)*info.width+x0+px,dst=(py*size+px)*3+c;x[dst]=rgb[src*3+c]/255;y[dst]=masks[c][src]>0?1:0;}
      xs.push(...x);ys.push(...y);
    }
  }
}
const input=tf.tensor4d(xs,[48,size,size,3]),pred=model.predict(input),values=await pred.data();
const thresholds={},metrics={};
for(let k=0;k<3;k++){
  let best={dice:0,threshold:.5};
  for(const threshold of [.005,.01,.02,.03,.05,.075,.1,.15,.2,.25,.3,.35,.4,.45,.5]){
    let tp=0,fp=0,fn=0;for(let i=k;i<values.length;i+=3){if(values[i]>=threshold&&ys[i])tp++;else if(values[i]>=threshold)fp++;else if(ys[i])fn++;}
    const dice=2*tp/(2*tp+fp+fn||1);if(dice>best.dice)best={dice,threshold,tp,fp,fn};
  }
  thresholds[['MA','HE','EX'][k]]=best.threshold;metrics[['MA','HE','EX'][k]]=best;
}
const record=JSON.parse(await fs.readFile('models/lesions/training.json','utf8'));record.thresholds=thresholds;record.thresholdSelection={data:'48 lesion-centred patches from IDRiD 07 and 08 (development validation, not an untouched test)',metrics};
record.limitations+=' Thresholds are tuned on lesion-centred development patches; false positives may be substantial. No clinical validation.';
await fs.writeFile('models/lesions/training.json',JSON.stringify(record,null,2));console.log(JSON.stringify({thresholds,metrics}));tf.dispose([input,pred]);model.dispose();
