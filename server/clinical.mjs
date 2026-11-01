import express from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import {z} from 'zod';
import {currentUser,clinical} from './auth.mjs';
const notificationSchema=new mongoose.Schema({recipient:{type:String,index:true},caseId:String,title:String,titleHi:String,readAt:{type:Date,default:null}},{timestamps:true});
export const Notification=mongoose.models.Notification||mongoose.model('Notification',notificationSchema);
const text=n=>z.string().trim().min(1).max(n);
const medicine=z.object({name:text(150),dosage:text(100),frequency:text(150),duration:text(100),instructions:z.string().trim().max(500).default('')});
const prescription=z.object({version:z.number().int().positive(),medicines:z.array(medicine).min(1).max(20),observations:text(2000),followUpDate:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()});
export async function notify(recipients,caseId,title,titleHi){try{const ids=[...new Set(recipients.filter(Boolean))];if(ids.length)await Notification.insertMany(ids.map(recipient=>({recipient,caseId,title,titleHi})));}catch(e){console.error('Notification delivery failed:',e.message);}}
export function clinicalRouter({getCase,update}){
 const router=express.Router();
 router.get('/notifications',async(req,res)=>res.json(await Notification.find({recipient:String(currentUser()._id)}).sort({createdAt:-1}).limit(200).lean()));
 router.patch('/notifications/:id/read',async(req,res)=>{if(!mongoose.isValidObjectId(req.params.id))return res.status(400).json({error:'Invalid notification ID.'});const n=await Notification.findOneAndUpdate({_id:req.params.id,recipient:String(currentUser()._id)},{$set:{readAt:new Date()}},{new:true});if(!n)return res.status(404).json({error:'Notification not found.'});res.json(n);});
 router.post('/cases/:id/prescriptions',async(req,res)=>{
  clinical();const user=currentUser();if(user.role!=='doctor'||!user.verified)return res.status(403).json({error:'Only a verified doctor can issue a prescription.'});
  const v=prescription.parse(req.body),doc=await getCase(req.params.id);
  if(!doc.review||doc.review.reviewerId!==String(user._id))return res.status(400).json({error:'Review the current images yourself before prescribing.'});
  if(v.followUpDate){const parsed=new Date(v.followUpDate+'T00:00:00Z');if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==v.followUpDate)return res.status(400).json({error:'Invalid follow-up date.'});}
  const rx={id:crypto.randomUUID(),status:'active',doctorId:String(user._id),doctorName:user.name,registration:user.registration,hospital:user.hospital,issuedAt:new Date().toISOString(),medicines:v.medicines,observations:v.observations,followUpDate:v.followUpDate||null};
  const saved=await update(doc,v.version,{prescriptions:[...(doc.prescriptions||[]),rx]});
  // The clinical record is authoritative; a notification failure must not invite duplicate prescriptions.
  let notificationSaved=true;try{if(doc.ownerId)await Notification.create({recipient:doc.ownerId,caseId:doc._id,title:'A doctor issued a prescription. Open Prescriptions to read it.',titleHi:'डॉक्टर ने प्रिस्क्रिप्शन जारी किया है। पढ़ने के लिए प्रिस्क्रिप्शन खोलें।'});}catch(e){notificationSaved=false;console.error('Prescription notification failed',e.message);}
  res.status(201).json({...saved,notificationSaved});
 });
 router.patch('/cases/:id/prescriptions/:rxId/discontinue',async(req,res)=>{
  clinical();const user=currentUser(),v=z.object({version:z.number().int().positive(),reason:text(500)}).parse(req.body),doc=await getCase(req.params.id),rx=doc.prescriptions?.find(p=>p.id===req.params.rxId);
  if(!rx)return res.status(404).json({error:'Prescription not found.'});
  if(user.role!=='doctor'||rx.doctorId!==String(user._id))return res.status(403).json({error:'Only the issuing doctor can discontinue this prescription.'});
  if(rx.status!=='active')return res.status(409).json({error:'Prescription is already discontinued.'});
  const saved=await update(doc,v.version,{prescriptions:doc.prescriptions.map(p=>p.id===rx.id?{...p,status:'discontinued',discontinuedAt:new Date().toISOString(),discontinuedBy:String(user._id),reason:v.reason}:p)});
  await notify([doc.ownerId],doc._id,'Your doctor discontinued a prescription. Read the updated instructions.','डॉक्टर ने प्रिस्क्रिप्शन बंद किया है। अपडेट निर्देश पढ़ें।');res.json(saved);
 });
 return router;
}
