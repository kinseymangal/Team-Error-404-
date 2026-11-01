import * as tf from '@tensorflow/tfjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { LABELS, IMAGE_SIZE, MODEL_TYPE } from '../shared/constants.js';
import { hash } from '../server/images.js';

export async function initializeTensorFlow() { await tf.setBackend('cpu'); await tf.ready(); }
export function tensorFromPixels(pixels) {
  return tf.tidy(()=>tf.tensor3d(Uint8Array.from(pixels),[IMAGE_SIZE,IMAGE_SIZE,3],'int32').toFloat().div(255));
}
export function buildModel(seed=42) {
  const model=tf.sequential();
  for (const [i,filters] of [16,32,64].entries()) {
    model.add(tf.layers.conv2d({...(i===0?{inputShape:[IMAGE_SIZE,IMAGE_SIZE,3]}:{}),
      filters,kernelSize:3,strides:2,padding:'same',activation:'relu',
      kernelInitializer:tf.initializers.glorotUniform({seed:seed+i})}));
  }
  model.add(tf.layers.globalAveragePooling2d({}));
  model.add(tf.layers.dense({units:32,activation:'relu',kernelInitializer:tf.initializers.glorotUniform({seed:seed+3})}));
  model.add(tf.layers.dense({units:5,activation:'softmax',kernelInitializer:tf.initializers.glorotUniform({seed:seed+4})}));
  return model;
}
export async function saveModel(model,directory,metadata={}) {
  await mkdir(directory,{recursive:true});
  await model.save(tf.io.withSaveHandler(async artifacts=>{
    const weightData=Array.isArray(artifacts.weightData)?Buffer.concat(artifacts.weightData.map(x=>Buffer.from(x))):Buffer.from(artifacts.weightData);
    await writeFile(path.join(directory,'weights.bin'),weightData);
    await writeFile(path.join(directory,'model.json'),JSON.stringify({format:'layers-model',generatedBy:'TensorFlow.js',
      modelTopology:artifacts.modelTopology,weightsManifest:[{paths:['weights.bin'],weights:artifacts.weightSpecs}]}));
    await writeFile(path.join(directory,'metadata.json'),JSON.stringify({...metadata,architecture:MODEL_TYPE,
      labels:LABELS,image_size:IMAGE_SIZE,weights_sha256:hash(weightData),clinically_validated:false},null,2));
    return {modelArtifactsInfo:{dateSaved:new Date(),modelTopologyType:'JSON',
      modelTopologyBytes:Buffer.byteLength(JSON.stringify(artifacts.modelTopology)),weightSpecsBytes:Buffer.byteLength(JSON.stringify(artifacts.weightSpecs)),weightDataBytes:weightData.length}};
  }));
}
export async function loadModel(directory) {
  const [json,metadata,weights]=await Promise.all([
    readFile(path.join(directory,'model.json'),'utf8').then(JSON.parse),
    readFile(path.join(directory,'metadata.json'),'utf8').then(JSON.parse),readFile(path.join(directory,'weights.bin'))]);
  if (metadata.architecture!==MODEL_TYPE || metadata.image_size!==IMAGE_SIZE || JSON.stringify(metadata.labels)!==JSON.stringify(LABELS)) throw new Error('Incompatible model labels or preprocessing');
  if (hash(weights)!==metadata.weights_sha256) throw new Error('Model weight checksum mismatch');
  if (json.weightsManifest?.length!==1 || JSON.stringify(json.weightsManifest[0].paths)!=='["weights.bin"]') throw new Error('Unsupported weight manifest');
  const model=await tf.loadLayersModel(tf.io.fromMemory({modelTopology:json.modelTopology,
    weightSpecs:json.weightsManifest[0].weights,weightData:weights.buffer.slice(weights.byteOffset,weights.byteOffset+weights.byteLength)}));
  if (model.outputs[0].shape.at(-1)!==5 || JSON.stringify(model.inputs[0].shape.slice(1))!==JSON.stringify([IMAGE_SIZE,IMAGE_SIZE,3])) {
    model.dispose(); throw new Error('Incompatible model shape');
  }
  return {model,metadata,id:hash(Buffer.concat([Buffer.from(JSON.stringify(json)),weights])).slice(0,16)};
}
export async function predictPixels(model,pixels) {
  const input=tf.tidy(()=>tensorFromPixels(pixels).expandDims(0));
  let output;
  try {output=model.predict(input); return Array.from(await output.data());}
  finally {input.dispose();output?.dispose();}
}
export {tf};
