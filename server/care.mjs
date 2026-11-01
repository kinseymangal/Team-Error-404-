import {getFacilities} from './facilities.mjs';
import {accessFilter,clinical,admin,currentUser} from './auth.mjs';
import express from 'express';
import mongoose from 'mongoose';
import {z} from 'zod';
import {facilities,todayIndia,planReferral} from './domain.mjs';
const bad=message=>Object.assign(new Error(message),{status:400});
const tripSchema=new mongoose.Schema({_id:String,version:{type:Number,default:1},capacity:Number,vehicle:String,coordinator:String,pickup:String,time:String,status:String,updatedAt:String},{versionKey:false});
export const Trip=mongoose.models.Trip||mongoose.model('Trip',tripSchema);
export const groupKey=c=>`${c.referral.facilityId}/${c.referral.date}/${c.patient.villageId}`;
export function transportGroups(cases){
 const groups=new Map();for(const c of cases){if(!c.patient.transportNeeded||!c.referral||c.referral.status==='attended'||c.referral.appointmentStatus==='cancelled')continue;
 const key=groupKey(c);if(!groups.has(key))groups.set(key,{key,facilityId:c.referral.facilityId,date:c.referral.date,villageId:c.patient.villageId,members:[],seats:0});
 const g=groups.get(key);g.members.push({id:c._id,name:c.patient.name,confirmed:!!c.referral.confirmed,needsReReview:!!c.referral.needsReReview,escortNeeded:c.patient.escortNeeded,escortConfirmed:c.patient.escortConfirmed});g.seats+=1+(c.patient.escortNeeded?1:0);}
 return [...groups.values()];
}
export function careRouter({Case,getCase,update}){
 const router=express.Router();
 router.patch('/cases/:id/appointment',async(req,res)=>{
  const v=z.object({version:z.number().int().positive(),status:z.enum(['requested','confirmed','cancelled']),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),reference:z.string().trim().max(150).default(''),confirmedBy:z.string().trim().max(100).default('')}).parse(req.body),doc=await getCase(req.params.id);
  if(!doc.referral)throw bad('Save an appointment request first.');
  if(v.status==='confirmed'){
   if(!doc.review||doc.referral.needsReReview)throw bad('Review the latest images and save a new appointment plan first.');
   if(!v.time||v.reference.length<2||v.confirmedBy.length<2)throw bad('Record the hospital-confirmed time, confirmation reference/contact and staff name.');
   const p=planReferral(doc.patient,doc.review.urgencyDays,todayIndia(),doc.review.reviewedAt.slice(0,10),await getFacilities());
   if(!p.options.some(f=>f.id===doc.referral.facilityId&&f.dates.includes(doc.referral.date)))throw bad('Appointment date is outside the current review window or available days. Re-plan it.');
  }
  res.json(await update(doc,v.version,{referral:{...doc.referral,appointmentStatus:v.status,confirmed:v.status==='confirmed',appointmentTime:v.status==='confirmed'?v.time:'',confirmationReference:v.status==='confirmed'?v.reference:'',confirmedBy:v.status==='confirmed'?v.confirmedBy:'',confirmationSource:v.status==='confirmed'?'reported_external':'',recordedByUserId:String(currentUser()._id),recordedByRole:currentUser().role,history:[...(doc.referral.history||[]),{status:v.status,at:new Date().toISOString(),actor:currentUser().name,actorId:String(currentUser()._id),actorRole:currentUser().role,reference:v.reference}]}}));
 });
 router.patch('/cases/:id/logistics',async(req,res)=>{
  const v=z.object({version:z.number().int().positive(),transportNeeded:z.boolean(),escortNeeded:z.boolean(),escortConfirmed:z.boolean()}).parse(req.body),doc=await getCase(req.params.id);
  res.json(await update(doc,v.version,{patient:{...doc.patient,transportNeeded:v.transportNeeded,escortNeeded:v.escortNeeded,escortConfirmed:v.escortNeeded&&v.escortConfirmed}}));
 });
 router.put('/cases/:id/eyes/:side/annotations',async(req,res)=>{
  clinical();
  const side=z.enum(['left','right']).parse(req.params.side),v=z.object({version:z.number().int().positive(),reviewer:z.string().trim().min(2).max(100),regions:z.array(z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1),rx:z.number().min(.005).max(.5),ry:z.number().min(.005).max(.5),label:z.string().trim().min(2).max(180),category:z.enum(['MA','HE','EX','SE','OTHER']).default('OTHER')})).max(30)}).parse(req.body),doc=await getCase(req.params.id);
  if(!doc.eyes?.[side])throw bad('Upload this eye first.');
  if(v.regions.some(r=>r.x-r.rx<-.001||r.x+r.rx>1.001||r.y-r.ry<-.001||r.y+r.ry>1.001))throw bad('Circles must stay within the image.');
  const annotations=v.regions.map(r=>({...r,source:'reviewer',status:'pending',reviewerId:String(currentUser()._id),reviewer:currentUser().name,at:new Date().toISOString()}));
  res.json(await update(doc,v.version,{eyes:{...doc.eyes,[side]:{...doc.eyes[side],annotations}},review:null,referral:doc.referral?{...doc.referral,needsReReview:true,confirmed:false}:null}));
 });
 router.get('/trips',async(req,res)=>{
  const groups=transportGroups(await Case.find(accessFilter()).lean()),saved=await Trip.find({_id:{$in:groups.map(g=>g.key)}}).lean();
  res.json(groups.map(g=>({...g,trip:saved.find(t=>t._id===g.key)||null})));
 });
 router.put('/trips',async(req,res)=>{admin();
  const v=z.object({key:z.string().max(200),version:z.number().int().min(0),capacity:z.number().int().min(1).max(100),vehicle:z.string().trim().max(100),coordinator:z.string().trim().min(2).max(100),pickup:z.string().trim().min(2).max(200),time:z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),status:z.enum(['planning','arranged'])}).parse(req.body);
  const group=transportGroups(await Case.find(accessFilter()).lean()).find(g=>g.key===v.key);if(!group)throw bad('No active patients remain in this group. Refresh.');
  if(v.status==='arranged'&&(v.capacity<group.seats||!v.vehicle||group.members.some(m=>!m.confirmed||m.needsReReview||(m.escortNeeded&&!m.escortConfirmed))))throw bad('Confirm appointments, arrange required escorts, enter the vehicle and provide enough seats before marking transport arranged.');
  const {_id,version,...fields}={...v,_id:v.key};delete fields.key;fields.updatedAt=new Date().toISOString();
  let trip;if(v.version===0){try{trip=await Trip.create({_id:v.key,...fields});}catch(e){if(e.code===11000)throw Object.assign(new Error('Trip changed. Refresh before saving.'),{status:409});throw e;}}
  else {trip=await Trip.findOneAndUpdate({_id:v.key,version:v.version},{$set:fields,$inc:{version:1}},{new:true});if(!trip)throw Object.assign(new Error('Trip changed. Refresh before saving.'),{status:409});}
  res.json(trip);
 });
 return router;
}
