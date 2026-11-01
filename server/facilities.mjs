import crypto from 'node:crypto';
import express from 'express';
import mongoose from 'mongoose';
import {z} from 'zod';
import fs from 'node:fs/promises';
import {admin,currentUser} from './auth.mjs';
import {distanceKm,todayIndia} from './domain.mjs';
import {villages} from './directory.mjs';
const schema=new mongoose.Schema({_id:String,name:String,nameHi:String,address:String,locality:{type:String,index:true},phone:String,websiteUrl:String,bookingUrl:String,sourceUrl:String,sourceNote:String,checkedAt:String,verificationStatus:String,facilityType:{type:String,index:true},services:[String],hours:String,hoursHi:String,days:{type:[Number],default:undefined},coordinates:{lat:Number,lng:Number},coordinateSource:String,active:{type:Boolean,default:true,index:true},version:{type:Number,default:1},updatedBy:String,updatedAt:String},{versionKey:false});
export const Facility=mongoose.models.Facility||mongoose.model('Facility',schema);
let client,promise;
export async function seedDirectory(){const c=mongoose.connection.getClient();if(client!==c){client=c;promise=null;}if(!promise)promise=(async()=>{const rows=JSON.parse(await fs.readFile(new URL('./directory-seed.json',import.meta.url),'utf8'));await Facility.bulkWrite(rows.map(({id,...f})=>({updateOne:{filter:{_id:id},update:{$setOnInsert:f},upsert:true}})));})().catch(e=>{promise=null;throw e;});await promise;}
export function publicFacility(f){return {...f,id:f._id,mapUrl:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(f.name+' '+f.address)}`,availabilityConfirmed:false,transportDays:[],seats:null};}
export async function getFacilities(){await seedDirectory();return (await Facility.find({active:true}).sort({name:1}).lean()).map(publicFacility);}
const url=z.string().trim().max(1500).refine(v=>!v||/^https?:\/\//i.test(v),'Use an http or https URL');
const fields=z.object({name:z.string().trim().min(3).max(180),nameHi:z.string().trim().max(180).default(''),address:z.string().trim().min(5).max(500),locality:z.string().trim().min(2).max(100),phone:z.string().trim().max(30).regex(/^[+0-9 ()-]*$/).default(''),websiteUrl:url.default(''),bookingUrl:url.default(''),sourceUrl:url.refine(v=>!!v,'A source is required'),sourceNote:z.string().max(500).default(''),facilityType:z.enum(['hospital','clinic','multispeciality','government']),services:z.array(z.enum(['eye_review','retina_review','cataract','glaucoma','cornea','lasik','pediatric'])).min(1).max(7),hours:z.string().max(250).default(''),hoursHi:z.string().max(250).default(''),days:z.array(z.number().int().min(0).max(6)).max(7).nullable().default(null),coordinates:z.object({lat:z.number().min(-90).max(90),lng:z.number().min(-180).max(180)}).nullable().default(null),coordinateSource:url.default(''),active:z.boolean().default(true),sourceChecked:z.boolean().default(false)}).superRefine((v,c)=>{if(v.coordinates&&!v.coordinateSource)c.addIssue({code:'custom',path:['coordinateSource'],message:'Provide a coordinate source'});});
export function directoryRouter(){const router=express.Router();
 router.get('/directory',async(req,res)=>res.json({facilities:await getFacilities(),villages,fictional:false}));
 router.get('/directory/search',async(req,res)=>{
  await seedDirectory();const q=z.object({q:z.string().max(150).default(''),locality:z.string().max(100).default(''),service:z.string().max(40).default(''),type:z.enum(['','hospital','clinic','multispeciality','government']).default(''),sort:z.enum(['name','distance']).default('name'),page:z.coerce.number().int().min(1).max(10000).default(1),pageSize:z.coerce.number().int().min(1).max(50).default(6),lat:z.coerce.number().min(-90).max(90).optional(),lng:z.coerce.number().min(-180).max(180).optional(),includeInactive:z.enum(['0','1']).default('0')}).parse(req.query);
  const all=await Facility.find(q.includeInactive==='1'&&currentUser().role==='admin'?{}:{active:true}).lean();
  const term=q.q.toLocaleLowerCase();let rows=all.filter(f=>(!term||[f.name,f.nameHi,f.address,f.locality,...f.services].join(' ').toLocaleLowerCase().includes(term))&&(!q.locality||f.locality===q.locality)&&(!q.service||f.services.includes(q.service))&&(!q.type||f.facilityType===q.type)).map(publicFacility);
  if(q.sort==='distance'&&(q.lat===undefined||q.lng===undefined))return res.status(400).json({error:'Allow location access before sorting by distance.'});
  rows=rows.map(f=>({...f,distanceKm:q.lat!==undefined&&q.lng!==undefined&&f.coordinates?.lat!=null&&f.coordinates?.lng!=null?distanceKm({lat:q.lat,lng:q.lng},f.coordinates):null}));
  rows.sort((a,b)=>q.sort==='distance'?(a.distanceKm??Infinity)-(b.distanceKm??Infinity)||a.name.localeCompare(b.name):a.name.localeCompare(b.name));
  res.json({items:rows.slice((q.page-1)*q.pageSize,q.page*q.pageSize),total:rows.length,page:q.page,pageSize:q.pageSize,pages:Math.ceil(rows.length/q.pageSize),localities:[...new Set(all.map(f=>f.locality))].sort(),mapItems:rows,located:rows.filter(f=>f.coordinates?.lat!=null).length});
 });
 router.post('/directory',async(req,res)=>{admin();await seedDirectory();const {sourceChecked,...v}=fields.parse(req.body),id='facility-'+crypto.randomUUID();const f=await Facility.create({_id:id,...v,checkedAt:sourceChecked?todayIndia():'',verificationStatus:sourceChecked?'source_checked':'admin_updated',updatedBy:String(currentUser()._id),updatedAt:new Date().toISOString()});res.status(201).json(publicFacility(f.toObject()));});
 router.put('/directory/:id',async(req,res)=>{admin();await seedDirectory();const version=z.number().int().positive().parse(req.body.version),{sourceChecked,...v}=fields.parse(req.body);const f=await Facility.findOneAndUpdate({_id:req.params.id,version},{$set:{...v,checkedAt:sourceChecked?todayIndia():'',verificationStatus:sourceChecked?'source_checked':'admin_updated',updatedBy:String(currentUser()._id),updatedAt:new Date().toISOString()},$inc:{version:1}},{new:true}).lean();if(!f)return res.status(409).json({error:'Listing changed. Refresh before saving.'});res.json(publicFacility(f));});
 return router;
}
