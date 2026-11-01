// Verify exported candidate against held-out Python predictions, using production preprocessing.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import * as ort from 'onnxruntime-node';
const [directory,data]=process.argv.slice(2);
if(!directory||!data)throw new Error('Specify candidate directory and original image directory');
const rows=JSON.parse(await fs.readFile(path.join(directory,'test-predictions.json'),'utf8'));
const meta=JSON.parse(await fs.readFile(path.join(directory,'metadata.json'),'utf8'));
const session=await ort.InferenceSession.create(path.join(directory,'model.onnx'),{executionProviders:['cpu'],intraOpNumThreads:2});
let maximumDifference=0,decisionMismatches=0;const counts=[[0,0],[0,0]];
for(const row of rows){
 const rgb=await sharp(path.join(data,row.id+'.jpg')).rotate().flatten({background:'#000'}).toColourspace('srgb').removeAlpha().resize(224,224,{fit:'contain',background:'#000',kernel:'linear'}).raw().toBuffer();
 const x=new Float32Array(224*224*3),mean=[.485,.456,.406],std=[.229,.224,.225];
 for(let i=0;i<224*224;i++)for(let c=0;c<3;c++)x[c*224*224+i]=(rgb[i*3+c]/255-mean[c])/std[c];
 const result=await session.run({image:new ort.Tensor('float32',x,[1,3,224,224])});
 const logits=Array.from(result.logits.data),max=Math.max(...logits),e=logits.map(v=>Math.exp(v-max)),p=e[1]/(e[0]+e[1]);
 maximumDifference=Math.max(maximumDifference,Math.abs(p-row.score));
 const predicted=Number(p>=meta.threshold);if(predicted!==Number(row.score>=meta.threshold))decisionMismatches++;
 counts[row.actual][predicted]++;
}
const report={images:rows.length,maximumScoreDifference:maximumDifference,decisionMismatches,confusionMatrix:counts,passed:maximumDifference<1e-4&&decisionMismatches===0};
await fs.writeFile(path.join(directory,'api-parity.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(report));if(!report.passed)process.exitCode=1;
