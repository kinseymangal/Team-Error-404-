import express from 'express';
import multer from 'multer';
import yauzl from 'yauzl';
import fs from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {pipeline} from 'node:stream/promises';
import * as tf from '@tensorflow/tfjs';
import {z} from 'zod';
import {learningFeatures,quality} from './inference.mjs';
const manifestPath='data/imported-manifest.json';
let job={status:'idle'};
const readManifest=async()=>{try{return JSON.parse(await fs.readFile(manifestPath,'utf8'));}catch{return [];}};
const bad=message=>Object.assign(new Error(message),{status:400});
export function safeArchivePath(root,name){
  if(name.includes('\\')||name.includes('\0')||name.split('/').includes('..')||path.isAbsolute(name)||/^[A-Za-z]:/.test(name))throw bad('Unsafe archive path.');
  const dest=path.resolve(root,name);if(!dest.startsWith(path.resolve(root)+path.sep))throw bad('Unsafe archive path.');return dest;
}
async function extractZip(file,directory){
  await fs.mkdir(directory,{recursive:true});
  return new Promise((resolve,reject)=>yauzl.open(file,{lazyEntries:true,validateEntrySizes:true},(err,zip)=>{
    if(err)return reject(bad('Invalid ZIP archive.'));
    let entries=0,total=0,failed=false;
    const fail=e=>{failed=true;zip.close();reject(e);};
    zip.on('error',fail);zip.on('end',()=>!failed&&resolve());
    zip.on('entry',async entry=>{try{
      if(++entries>10000||entry.uncompressedSize>25*1024*1024||(total+=entry.uncompressedSize)>1024*1024*1024)throw bad('Archive exceeds safe extraction limits. Use a smaller subset or the local import script.');
      const dest=safeArchivePath(directory,entry.fileName);
      if(((entry.externalFileAttributes>>>16)&0o170000)===0o120000)throw bad('Archive symlinks are not allowed.');
      if(entry.fileName.endsWith('/')){await fs.mkdir(dest,{recursive:true});zip.readEntry();return;}
      if(!/\.(jpg|jpeg|png|webp|csv|json)$/i.test(entry.fileName)){zip.readEntry();return;}
      await fs.mkdir(path.dirname(dest),{recursive:true});
      zip.openReadStream(entry,async(e,stream)=>{if(e)return fail(e);try{await pipeline(stream,createWriteStream(dest));zip.readEntry();}catch(e){fail(e);}});
    }catch(e){fail(e);}});zip.readEntry();
  }));
}
async function resolveLabels(directory,kind){
  if(kind==='aptos'){
    const csv=(await fs.readFile(path.join(directory,'train.csv'),'utf8')).replace(/^\uFEFF/,'').trim().split(/\r?\n/);
    if(csv.shift().replaceAll('"','').trim()!=='id_code,diagnosis')throw bad('APTOS requires train.csv with id_code,diagnosis header at the ZIP root.');
    return csv.map(line=>{
      const [code,label]=line.replaceAll('"','').split(',');if(!/^[\w-]+$/.test(code))throw bad('Invalid APTOS image ID.');
      return {image:`train_images/${code}.png`,grade:Number(label),patientGroup:`aptos-image:${code}`,consent:true,reviewer:'APTOS provided annotation',source:'APTOS',patientIdentityAvailable:false};
    });
  }
  return z.array(z.object({image:z.string(),grade:z.number().int().min(0).max(4),patientGroup:z.string().min(1).max(100),consent:z.literal(true),reviewer:z.string().min(2).max(100)})).max(10000).parse(JSON.parse(await fs.readFile(path.join(directory,'labels.json'),'utf8')));
}
export async function importFolder(directory,kind){
  const labels=await resolveLabels(directory,kind),existing=await readManifest(),seen=new Map(existing.map(r=>[r.sha256,r.grade]));let added=0,duplicates=0;
  const pending=[];
  for(const row of labels){
    z.number().int().min(0).max(4).parse(row.grade);
    const imagePath=safeArchivePath(directory,row.image),bytes=await fs.readFile(imagePath),hash=crypto.createHash('sha256').update(bytes).digest('hex');
    if(seen.has(hash)){if(seen.get(hash)!==row.grade)throw bad('Duplicate image has conflicting labels. Resolve the source annotations before import.');duplicates++;continue;}
    // Parse and validate the actual file, rather than trusting its extension.
    const q=await quality(bytes);if(!q.accepted)continue;
    seen.set(hash,row.grade);pending.push({...row,imagePath,sha256:hash,source:row.source||'reviewed-import'});added++;
  }
  await fs.mkdir('data',{recursive:true});
  await fs.writeFile(manifestPath,JSON.stringify([...existing,...pending],null,2));
  return {added,duplicates,message:`Imported ${added} usable labelled images; skipped ${duplicates} duplicates. Unusable images were excluded. ${kind==='aptos'?'APTOS patient identities are unavailable: splits use image identity plus exact duplicate checks.':''}`};
}
async function approvedUploads(Case){
  const docs=await Case.find({'patient.trainingConsent':true,'patient.isDemo':{$ne:true},'review.approvedForTraining':true}).lean(),rows=[];
  for(const doc of docs)for(const side of ['left','right']){
    const eye=doc.eyes?.[side],grade=doc.review?.eyeGrades?.[side];
    if(eye?.result.status==='analyzed'&&eye.imagePath&&Number.isInteger(grade)&&doc.review.assessment!=='unable'){
      const file=path.resolve('.'+eye.imagePath);if(!file.startsWith(path.resolve('uploads')+path.sep))continue;
      const bytes=await fs.readFile(file);rows.push({imagePath:file,grade,patientGroup:doc._id,source:'consented-review',sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
    }
  }
  return rows;
}
export function splitGroups(rows){
  const groups=[...new Set(rows.map(r=>r.patientGroup))].sort((a,b)=>crypto.createHash('sha256').update(a).digest('hex').localeCompare(crypto.createHash('sha256').update(b).digest('hex')));
  const validation=new Set(groups.slice(0,Math.max(1,Math.ceil(groups.length*.2))));
  return {train:rows.filter(r=>!validation.has(r.patientGroup)),validation:rows.filter(r=>validation.has(r.patientGroup))};
}
async function trainCandidate(rows){
  job={status:'running',stage:'Extracting frozen retinal features',startedAt:new Date().toISOString(),images:rows.length};
  try{
    const split=splitGroups(rows),all=[...split.train,...split.validation],features=[];let baseline;
    for(const row of all){const v=await learningFeatures(await fs.readFile(row.imagePath));features.push(v.features);baseline??=v;job.processed=features.length;}
    const m=tf.sequential();m.add(tf.layers.dense({inputShape:[512],units:5,activation:'softmax'}));
    const weight=new Float32Array(512*5);for(let i=0;i<512;i++)for(let c=0;c<5;c++)weight[i*5+c]=baseline.weights[c*512+i];
    const wt=tf.tensor2d(weight,[512,5]),bt=tf.tensor1d(baseline.bias);m.setWeights([wt,bt]);tf.dispose([wt,bt]);
    m.compile({optimizer:tf.train.adam(.0002),loss:'categoricalCrossentropy',metrics:['accuracy']});
    const x=tf.tensor2d(features.slice(0,split.train.length)),y=tf.oneHot(tf.tensor1d(split.train.map(r=>r.grade),'int32'),5);
    const vx=tf.tensor2d(features.slice(split.train.length)),vy=tf.oneHot(tf.tensor1d(split.validation.map(r=>r.grade),'int32'),5);
    const before=m.evaluate(vx,vy),beforeMetric=await Promise.all(before.map(t=>t.data()));
    job.stage='Training candidate head';
    await m.fit(x,y,{epochs:12,batchSize:Math.min(16,split.train.length),shuffle:false,validationData:[vx,vy],callbacks:{onEpochEnd:(epoch,logs)=>{job.epoch=epoch+1;job.loss=logs.loss;job.validationAccuracy=logs.val_acc;}}});
    const after=m.evaluate(vx,vy),afterMetric=await Promise.all(after.map(t=>t.data()));
    const version=`candidate-${Date.now()}`,dir=`models/candidates/${version}`;await fs.mkdir(dir,{recursive:true});
    await m.save(tf.io.withSaveHandler(async a=>{await fs.writeFile(`${dir}/model.json`,JSON.stringify({modelTopology:a.modelTopology,weightsManifest:[{paths:['weights.bin'],weights:a.weightSpecs}]}));await fs.writeFile(`${dir}/weights.bin`,Buffer.from(a.weightData));return {modelArtifactsInfo:{dateSaved:new Date(),modelTopologyType:'JSON'}};}));
    job={...job,status:'complete',stage:'Candidate saved for evaluation',version,trainImages:split.train.length,validationImages:split.validation.length,
      before:{loss:beforeMetric[0][0],accuracy:beforeMetric[1][0]},after:{loss:afterMetric[0][0],accuracy:afterMetric[1][0]},activeModelChanged:false,
      limitations:'Small internal validation only. APTOS group IDs are image IDs, not verified patient identities. Candidate is not automatically promoted. No clinical performance claim.'};
    await fs.writeFile(`${dir}/report.json`,JSON.stringify(job,null,2));
    await fs.writeFile(`${dir}/split.json`,JSON.stringify({train:split.train.map(r=>({sha256:r.sha256,group:r.patientGroup,grade:r.grade})),validation:split.validation.map(r=>({sha256:r.sha256,group:r.patientGroup,grade:r.grade}))},null,2));
    tf.dispose([x,y,vx,vy,...before,...after]);m.dispose();
  }catch(e){job={...job,status:'failed',error:e.message};}
}
export function trainingRouter(Case){
  const router=express.Router(),upload=multer({dest:'.runtime/import-archives',limits:{fileSize:500*1024*1024,files:1}});
  router.get('/',async(req,res)=>res.json({eligibleImages:(await approvedUploads(Case)).length,importedImages:(await readManifest()).length,job}));
  router.post('/import',upload.single('archive'),async(req,res)=>{
    const kind=z.enum(['aptos','reviewed']).parse(req.body.kind);if(!req.file)throw bad('Choose a ZIP archive.');
    const directory=path.resolve('data/imports',crypto.randomUUID());
    try{await extractZip(req.file.path,directory);res.json(await importFolder(directory,kind));}finally{await fs.unlink(req.file.path).catch(()=>{});}
  });
  router.post('/run',async(req,res)=>{
    if(job.status==='running')return res.status(409).json({error:'Training is already running.'});
    const raw=[...await approvedUploads(Case),...await readManifest()],dedup=new Map();
    for(const row of raw){if(dedup.has(row.sha256)&&dedup.get(row.sha256).grade!==row.grade)throw bad('Conflicting labels exist for the same image.');dedup.set(row.sha256,row);}
    const rows=[...dedup.values()];
    if(rows.length<10||new Set(rows.map(r=>r.patientGroup)).size<5||new Set(rows.map(r=>r.grade)).size<2)throw bad('Need at least 10 unique usable images, 5 groups and 2 grade classes. Consented uploads also need approved eye-specific reviewer labels.');
    const {train}=splitGroups(rows);if(new Set(train.map(r=>r.grade)).size<2)throw bad('Training partition needs at least 2 grade classes. Add more reviewed data.');
    void trainCandidate(rows);res.status(202).json({message:'Supervised candidate training started. Refresh this page to see progress. The active model is unchanged.'});
  });
  return router;
}
