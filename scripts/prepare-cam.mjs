import fs from 'node:fs/promises';
import proto from 'onnx-proto';
const {onnx}=proto;
const model=onnx.ModelProto.decode(await fs.readFile('models/grader-original.onnx'));
const pool=model.graph.node.findLast(n=>n.opType==='ReduceMean'||n.opType==='GlobalAveragePool');
if(!pool || pool.input[0]!=='relu_48')throw new Error('Unexpected classifier architecture; do not fabricate an attention map.');
for(const [name,dims] of [['relu_48',[1,2048,7,7]],['linear',[1,1024]],['linear_1',[1,512]],['getitem_162',[1,512]]])model.graph.output.push(onnx.ValueInfoProto.create({name,type:{tensorType:{elemType:1,shape:{dim:dims.map(dimValue=>({dimValue}))}}}}));
await fs.writeFile('models/grader.onnx',onnx.ModelProto.encode(model).finish());
const parts=[],tensors={};let offset=0;
for(const i of model.graph.initializer.filter(i=>i.name.startsWith('fc.'))){
  const data=i.rawData?.length?Buffer.from(i.rawData):Buffer.from(Float32Array.from(i.floatData).buffer);
  tensors[i.name]={offset:offset/4,length:data.length/4,dims:i.dims.map(Number)};parts.push(data);offset+=data.length;
}
await fs.writeFile('models/cam-head.bin',Buffer.concat(parts));
await fs.writeFile('models/cam.json',JSON.stringify({activation:'relu_48',channels:2048,tensors,epsilon:1e-5,method:'Exact logit gradients through Gemm/ReLU/evaluation BatchNorm and global average pooling.'}));
console.log('Prepared grading and analytical Grad-CAM outputs.');
