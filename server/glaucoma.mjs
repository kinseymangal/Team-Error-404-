import {opticModelStatus,segmentOpticDisc} from './optic-segmentation.mjs';
import fs from 'node:fs/promises';
import {loadBinaryGlaucoma} from './glaucoma-binary.mjs';
import {Engine} from './glaucoma/server/engine.js';
import crypto from 'node:crypto';
let enginePromise;
async function engine(){
 if(!enginePromise)enginePromise=(async()=>{
  const binary=await loadBinaryGlaucoma(process.env.GLAUCOMA_MODEL_DIR||'models/glaucoma');
  if(binary)return binary;
  const value=Number(process.env.GLAUCOMA_THRESHOLD??'.7');
  const instance=new Engine({threshold:value});
  await instance.load(process.env.GLAUCOMA_MODEL_DIR||'models/glaucoma');
  return instance;
 })();
 return enginePromise;
}
export async function glaucomaStatus(){
 const status=(await engine()).status(),optic=await opticModelStatus();
 let candidateEvaluation=null;
 try{const report=JSON.parse(await fs.readFile('models/evaluation/glaucoma-training.json','utf8'));candidateEvaluation={completed:report.status==='completed',enabled:!!status.model_loaded,engineeringGate:report.engineeringGate,test:report.test,patientBootstrap95CI:report.patientBootstrap95CI,limitations:report.limitations};}catch{}
 return {...status,candidateEvaluation,configured:status.model_loaded,status:status.model_loaded?'research-only':'coming-soon',segmentation:optic.available,segmentationStructures:optic.supportedStructures,cupSegmentation:false,heatmap:status.heatmap_available===true,
  limitation:status.model_loaded?'Research evaluation only; not clinically validated. Binary screening does not establish severity or a diagnosis.':'The supplied package has no medical weights or clinical validation. Its five project-specific labels are not a validated clinical staging system.'};
}
export async function analyzeGlaucoma(buffer,side,confirmed=false){
 const instance=await engine(),status=instance.status(),imageSha256=crypto.createHash('sha256').update(buffer).digest('hex');
 if(!status.model_loaded)return {disease:'glaucoma',status:'not_configured',level:null,label:null,scores:null,model_id:null,image_sha256:imageSha256,analyzedAt:new Date().toISOString(),clinically_validated:false,message:status.error||'Coming soon — the supplied package contains no trained glaucoma weights. No glaucoma prediction was made.'};
 const result=await instance.analyze(buffer,side,confirmed);
 let opticSegmentation=null;
 if(result.status==='research_prediction')try{opticSegmentation=await segmentOpticDisc(buffer);}catch(e){console.error('Optic segmentation failed:',e.message);opticSegmentation={status:'failed',masks:{},warning:'Optic-disc segmentation failed. Rerun screening; no mask was invented.'};}
 return {...result,opticSegmentation,disease:'glaucoma',analyzedAt:new Date().toISOString(),clinically_validated:false};
}
