import test,{before,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import {MongoMemoryServer} from 'mongodb-memory-server-core';
import {User,passwordFields} from '../server/auth.mjs';
import {makeApp,Case} from '../server/app.mjs';
import {planReferral,gradCam,softmax} from '../server/domain.mjs';
import {safeArchivePath,splitGroups} from '../server/training.mjs';
import {quality,analyze,learningFeatures} from '../server/inference.mjs';
let mongo,server,base,patientCookie,doctorCookie,adminCookie,patientId,doctorId;
before(async()=>{
  mongo=await MongoMemoryServer.create({binary:{version:'7.0.24',downloadDir:path.resolve('.runtime/bin')},instance:{storageEngine:'wiredTiger',dbName:'tests'}});
  await mongoose.connect(mongo.getUri('tests'));server=makeApp().listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;
  for(const role of ['patient','doctor','admin']){const email=role+'@prototype.test';const user=await User.create({name:'Synthetic '+role,email,role,verified:true,...await passwordFields('Synthetic-Test-123')});const response=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password:'Synthetic-Test-123'})});const cookie=response.headers.get('set-cookie').split(';')[0];if(role==='patient'){patientCookie=cookie;patientId=String(user._id);}if(role==='doctor'){doctorCookie=cookie;doctorId=String(user._id);}if(role==='admin')adminCookie=cookie;}

});
after(async()=>{await new Promise(r=>server.close(r));await mongoose.disconnect();await mongo.stop();});
async function request(route,options={}){const res=await fetch(base+route,{...options,headers:{'content-type':'application/json',cookie:patientCookie,...options.headers}});return {status:res.status,body:await res.json()};}
const patient={name:'Integration Demo',age:54,villageId:'v1',language:'hi',availableDays:[1,2,3,4,5,6],transportNeeded:true,escortNeeded:true,escortConfirmed:false,hasSmartphone:false,trainingConsent:false,syncConsent:false,isDemo:true};
test('Patients book and confirm their own appointments; authorized doctors choose hospitals without administrator access',async()=>{
 const caseId=crypto.randomUUID(),now=new Date().toISOString();
 await Case.create({_id:caseId,ownerId:patientId,authorizedDoctors:[],patient:{...patient,villageId:'indore-vijay',availableDays:[0,1,2,3,4,5,6],escortNeeded:false},eyes:{},review:{reviewer:'Synthetic doctor',assessment:'refer',grade:2,urgencyDays:14,reviewedAt:now},createdAt:now,updatedAt:now});
 const send=(url,body,cookie=patientCookie,method='POST')=>request(url,{method,headers:{cookie},body:JSON.stringify(body)});
 const plan=await request(`/api/cases/${caseId}/plan`);assert.equal(plan.status,200);const facility=plan.body.options[0];assert.ok(facility);
 let r=await send(`/api/cases/${caseId}/referral`,{version:1,facilityId:facility.id,date:facility.date});assert.equal(r.status,200);assert.equal(r.body.referral.appointmentStatus,'requested');let version=r.body.version;
 const confirmation={version,status:'confirmed',time:'10:30',reference:'Synthetic external hospital confirmation',confirmedBy:'Patient recording hospital response'};
 assert.equal((await send(`/api/cases/${caseId}/appointment`,confirmation,doctorCookie,'PATCH')).status,404);
 r=await send(`/api/cases/${caseId}/appointment`,confirmation,patientCookie,'PATCH');assert.equal(r.status,200);assert.equal(r.body.referral.confirmed,true);assert.equal(r.body.referral.recordedByRole,'patient');assert.equal(r.body.referral.confirmationSource,'reported_external');version=r.body.version;
 await Case.updateOne({_id:caseId},{$set:{authorizedDoctors:[doctorId]}});
 const alternate=plan.body.options[1]||facility;
 r=await send(`/api/cases/${caseId}/referral`,{version,facilityId:alternate.id,date:alternate.date},doctorCookie);assert.equal(r.status,200);assert.equal(r.body.referral.facilityId,alternate.id);version=r.body.version;
 r=await send(`/api/cases/${caseId}/appointment`,{...confirmation,version},doctorCookie,'PATCH');assert.equal(r.status,200);assert.equal(r.body.referral.recordedByRole,'doctor');
 const hiddenId=crypto.randomUUID();await Case.create({_id:hiddenId,ownerId:'another-patient',patient:{...patient,villageId:'indore-vijay'},referral:{facilityId:alternate.id,date:alternate.date,status:'planned',appointmentStatus:'requested'},createdAt:now,updatedAt:now});
 for(const cookie of [patientCookie,doctorCookie]){const trips=await request('/api/trips',{headers:{cookie}});assert.equal(trips.status,200);assert.ok(!trips.body.some(g=>g.members.some(m=>m.id===hiddenId)));}
 assert.equal((await send('/api/trips',{},patientCookie,'PUT')).status,403);
});
test('Registration is idempotent and preserves separate training consent',async()=>{
  const id=crypto.randomUUID(),body=JSON.stringify({id,patient});const a=await request('/api/cases',{method:'POST',body}),b=await request('/api/cases',{method:'POST',body});
  assert.equal(a.status,201);assert.equal(b.status,200);assert.equal(a.body._id,b.body._id);assert.equal(a.body.patient.trainingConsent,false);
  const bad=await request('/api/cases',{method:'POST',body:JSON.stringify({id,patient:{...patient,name:'Different patient'}})});assert.equal(bad.status,409);
});
test('Unauthenticated sync import is rejected',async()=>assert.equal((await request('/api/sync/receive',{method:'POST',headers:{cookie:''},body:'{"records":[]}'})).status,401));
test('Blurred benchmark is rejected without issuing a disease grade',async()=>{
  const q=await quality(await fs.readFile('public/samples/fundus.jpg'));assert.equal(q.accepted,true);
  const out=await analyze(await fs.readFile('public/samples/blurred.jpg'));assert.equal(out.status,'retake');assert.equal(out.grade,null);assert.ok(out.quality.reasons.some(r=>r.includes('blurred')));
});
test('Real ONNX inference returns five scores and independent masks/Grad-CAM',async()=>{
  const out=await analyze(await fs.readFile('public/samples/fundus.jpg'));
  assert.equal(out.status,'analyzed');assert.equal(out.probabilities.length,5);assert.ok(out.grade>=0&&out.grade<=4);assert.ok(Math.abs(out.probabilities.reduce((a,b)=>a+b)-1)<1e-6);
  assert.match(out.heatmap,/^data:image\/png;base64,/);assert.deepEqual(Object.keys(out.masks).sort(),['EX','HE','MA','SE']);assert.notEqual(out.heatmap,out.masks.MA.mask);assert.equal(out.reviewRequired,true);
  await fs.mkdir('test-results',{recursive:true});await fs.writeFile('test-results/inference.json',JSON.stringify({grade:out.grade,elapsedMs:out.elapsedMs,probabilities:out.probabilities,masks:Object.fromEntries(Object.entries(out.masks).map(([k,v])=>[k,{pixels:v.pixels,coveragePct:v.coveragePct}]))},null,2));
});
test('Feature extractor supports real candidate training',async()=>{
  const f=await learningFeatures(await fs.readFile('public/samples/fundus.jpg'));assert.equal(f.features.length,512);assert.equal(f.logits.length,5);assert.ok(f.features.every(Number.isFinite));
});
test('Referral respects clinician window and escalates missing escort',()=>{
  const p=planReferral(patient,14,'2026-11-01');assert.ok(p.options.length);assert.equal(p.escalate,true);assert.ok(p.options.every(o=>o.date<='2026-11-15'&&o.escortOutstanding));
  const impossible=planReferral({...patient,availableDays:[0]},2,'2026-11-10','2026-11-01');assert.equal(impossible.escalate,true);assert.equal(impossible.options.length,0);
});
test('Training split keeps both eyes of a patient together and rejects zip traversal',()=>{
  const rows=Array.from({length:10},(_,i)=>({patientGroup:`p${Math.floor(i/2)}`,id:i})),s=splitGroups(rows),train=new Set(s.train.map(r=>r.patientGroup));assert.ok(s.validation.every(r=>!train.has(r.patientGroup)));
  for(const name of ['../outside.png','C:\\outside.png','a/../../outside.png'])assert.throws(()=>safeArchivePath(path.resolve('data/imports/demo'),name));
});
test('Grad-CAM calculation uses positive class-weighted feature maps',()=>{assert.deepEqual(Array.from(gradCam([1,2,3,4],[2,-1],2,2,0)),[0,0]);assert.deepEqual(Array.from(gradCam([1,2,3,4],[1,1],2,2,0)),[2/3,1].map(Math.fround));assert.ok(softmax([1000,1001]).every(Number.isFinite));});
test('Review requires bilateral images; missing remote configuration does not fake sync',async()=>{
  const id=crypto.randomUUID();await request('/api/cases',{method:'POST',body:JSON.stringify({id,patient})});
  const r=await request(`/api/cases/${id}/review`,{method:'POST',body:JSON.stringify({version:1,reviewer:'Demo reviewer',assessment:'refer',grade:2,urgencyDays:14})});assert.equal(r.status,403);
  const sync=await request('/api/sync',{method:'POST'});assert.equal(sync.status,409);assert.match(sync.body.error,/disabled/);
});

test('Appointment, reviewer annotations and transport workflow persist and enforce state',async()=>{
 const caseId=crypto.randomUUID(),now=new Date().toISOString();
 const doc=await Case.create({_id:caseId,ownerId:patientId,authorizedDoctors:[doctorId],patient:{...patient,villageId:'indore-vijay',availableDays:[0,1,2,3,4,5,6]},eyes:{left:{imagePath:'/uploads/test.jpg',result:{status:'analyzed',grade:2}},right:{imagePath:'/uploads/test2.jpg',result:{status:'analyzed',grade:1}}},review:null,createdAt:now,updatedAt:now});
 const send=(route,method,body)=>request(route,{method,headers:{cookie:route==='/api/trips'?adminCookie:doctorCookie},body:JSON.stringify(body)});
 let r=await send(`/api/cases/${caseId}/referral`,'POST',{version:1,facilityId:'indore-sankara',date:now.slice(0,10)});assert.equal(r.status,400);
 r=await send(`/api/cases/${caseId}/review`,'POST',{version:1,reviewer:'Dr Test',assessment:'refer',grade:2,urgencyDays:14,notes:'Image-specific test note'});assert.equal(r.status,200);
 let version=r.body.version;
 const plan=await request(`/api/cases/${caseId}/plan`);assert.equal(plan.status,200);const option=plan.body.options[0];
 r=await send(`/api/cases/${caseId}/referral`,'POST',{version,facilityId:option.id,date:option.date});assert.equal(r.status,200);assert.equal(r.body.referral.confirmed,false);assert.equal(r.body.referral.appointmentStatus,'requested');version=r.body.version;
 r=await send(`/api/cases/${caseId}/appointment`,'PATCH',{version,status:'confirmed'});assert.equal(r.status,400);
 r=await send(`/api/cases/${caseId}/appointment`,'PATCH',{version,status:'confirmed',time:'10:00',reference:'Hospital desk reference 123',confirmedBy:'Camp coordinator'});assert.equal(r.status,200);assert.equal(r.body.referral.confirmed,true);version=r.body.version;
 let groups=await request('/api/trips',{headers:{cookie:adminCookie}}),group=groups.body.find(g=>g.members.some(m=>m.id===caseId));assert.ok(group);assert.equal(group.seats,2);
 const trip={key:group.key,version:0,capacity:1,vehicle:'Test bus',coordinator:'Coordinator',pickup:'Camp entrance',time:'09:00',status:'arranged'};
 r=await send('/api/trips','PUT',trip);assert.equal(r.status,400);
 r=await send(`/api/cases/${caseId}/logistics`,'PATCH',{version,transportNeeded:true,escortNeeded:true,escortConfirmed:true});assert.equal(r.status,200);version=r.body.version;
 r=await send('/api/trips','PUT',{...trip,capacity:2});assert.equal(r.status,200);assert.equal(r.body.status,'arranged');
 r=await send('/api/trips','PUT',{...trip,capacity:2});assert.equal(r.status,409);
 r=await send(`/api/cases/${caseId}/eyes/left/annotations`,'PUT',{version,reviewer:'Dr Test',regions:[{x:.5,y:.5,rx:.1,ry:.1,label:'Reviewer-marked finding'}]});assert.equal(r.status,200);assert.equal(r.body.review,null);assert.equal(r.body.referral.needsReReview,true);assert.equal(r.body.eyes.left.annotations.length,1);version=r.body.version;
 r=await send(`/api/cases/${caseId}/attendance`,'PATCH',{version,status:'attended'});assert.equal(r.status,400);
 r=await send(`/api/cases/${caseId}/appointment`,'PATCH',{version,status:'confirmed',time:'10:00',reference:'123',confirmedBy:'Coordinator'});assert.equal(r.status,400);
 r=await send(`/api/cases/${caseId}/eyes/left/annotations`,'PUT',{version,reviewer:'Dr Test',regions:[{x:.99,y:.5,rx:.2,ry:.1,label:'Outside image'}]});assert.equal(r.status,400);
 const saved=await request(`/api/cases/${caseId}`);assert.equal(saved.body.version,version);assert.equal(saved.body.eyes.left.annotations[0].label,'Reviewer-marked finding');
});

test('Existing report reruns AI from its saved image and invalidates stale review',async()=>{
 const id=crypto.randomUUID(),file=crypto.randomUUID()+'.jpg';
 await request('/api/cases',{method:'POST',body:JSON.stringify({id,patient})});
 await fs.mkdir('uploads',{recursive:true});await fs.copyFile('public/samples/IDRiD_55.jpg','uploads/'+file);
 try{
  await Case.updateOne({_id:id},{$set:{eyes:{left:{imagePath:'/uploads/'+file,result:{status:'analyzed'},annotations:[]}},review:{reviewer:'Synthetic old review'}}});
  assert.equal((await request(`/api/cases/${id}/eyes/left/reanalyze`,{method:'POST',body:JSON.stringify({version:99})})).status,409);
  const response=await request(`/api/cases/${id}/eyes/left/reanalyze`,{method:'POST',body:JSON.stringify({version:1})});
  assert.equal(response.status,200);assert.equal(response.body.review,null);assert.equal(response.body.eyes.left.previousReview.reviewer,'Synthetic old review');
  const result=response.body.eyes.left.result;assert.match(result.segmentationModelVersion,/clementp/);assert.ok(Object.values(result.masks).some(m=>m.regions.length>0));assert.ok(result.masks.SE);
  assert.equal(response.body.eyes.left.imagePath,'/uploads/'+file);
 }finally{await fs.unlink('uploads/'+file);}
});
