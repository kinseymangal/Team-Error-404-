import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {glaucomaStatus,analyzeGlaucoma} from '../server/glaucoma.mjs';
import os from 'node:os';
import path from 'node:path';
import {loadBinaryGlaucoma} from '../server/glaucoma-binary.mjs';
process.env.GLAUCOMA_MODEL_DIR=path.join(os.tmpdir(),'missing-glaucoma-'+process.pid);
test('Failed held-out glaucoma candidate cannot be activated',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'glaucoma-gate-'));
 try{
  await fs.writeFile(path.join(directory,'metadata.json'),JSON.stringify({architecture:'netriv-glaucoma-efficientnet-b0-v1',engineeringGatePassed:false}));
  await fs.writeFile(path.join(directory,'training-report.json'),JSON.stringify({engineeringGate:{passed:false}}));
  await assert.rejects(loadBinaryGlaucoma(directory),/activation refused/);
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
test('Supplied glaucoma package without weights abstains and preserves the exact image identity',async()=>{
 const status=await glaucomaStatus();
 assert.equal(status.configured,false);
 assert.equal(status.clinically_validated,false);
 assert.equal(status.segmentation,true);assert.equal(status.cupSegmentation,false);
 const image=await fs.readFile('public/samples/fundus.jpg');
 for(const confirmed of [false,true]){
  const r=await analyzeGlaucoma(image,'left',confirmed);
  assert.equal(r.status,'not_configured');
  assert.equal(r.level,null);assert.equal(r.scores,null);assert.equal(r.label,null);
  assert.equal(r.image_sha256,crypto.createHash('sha256').update(image).digest('hex'));
 }
});

test('Explicit research override loads the actual candidate without inventing severity grades',async()=>{
 const directory=await fs.mkdtemp(path.join(os.tmpdir(),'glaucoma-real-test-'));
 try{
  for(const name of ['model.onnx','metadata.json','training-report.json'])await fs.copyFile('models/glaucoma/'+name,path.join(directory,name));
  await fs.writeFile(path.join(directory,'research-testing.json'),JSON.stringify({enabled:true}));
  const runtime=await loadBinaryGlaucoma(directory);
  assert.equal(runtime.status().researchTestMode,true);assert.equal(runtime.status().clinically_validated,false);
  const image=await fs.readFile('public/samples/fundus.jpg');
  const automatic=await runtime.analyze(image,'left',false);assert.equal(automatic.status,'research_prediction');assert.equal(automatic.operator_confirmed_fundus_and_quality,false);assert.equal(automatic.researchTestMode,true);
  const result=await runtime.analyze(image,'left',true);
  assert.equal(result.status,'research_prediction');assert.equal(result.scores.length,2);assert.equal(result.level,null);
  assert.match(result.heatmap,/^data:image\/png;base64,/);assert.deepEqual(result.heatmapGrid,[7,7]);assert.equal(result.masks,undefined);
  const other=await runtime.analyze(await fs.readFile('public/samples/IDRiD_07.jpg'),'right',true);assert.notEqual(result.heatmap,other.heatmap);
 }finally{await fs.rm(directory,{recursive:true,force:true});}
});
