import {glaucomaStatus,analyzeGlaucoma} from './glaucoma.mjs';
import {chatRouter} from './chat.mjs';
import {directoryRouter,getFacilities} from './facilities.mjs';
import {diseases} from '../shared/visualization.mjs';
import {clinicalRouter,notify} from './clinical.mjs';
import {authRouter,sessionMiddleware,currentUser,accessFilter,clinical,admin,User} from './auth.mjs';
import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import sharp from 'sharp';
import {z} from 'zod';
import {analyze,modelStatus} from './inference.mjs';
import {facilities,villages,planReferral,todayIndia} from './domain.mjs';
import {careRouter,Trip} from './care.mjs';
import {trainingRouter} from './training.mjs';

const schema=new mongoose.Schema({_id:String,prescriptions:{type:[mongoose.Schema.Types.Mixed],default:[]},ownerId:{type:String,index:true},authorizedDoctors:{type:[String],default:[],index:true},patient:mongoose.Schema.Types.Mixed,eyes:{type:mongoose.Schema.Types.Mixed,default:{}},review:mongoose.Schema.Types.Mixed,referral:mongoose.Schema.Types.Mixed,version:{type:Number,default:1},syncedVersion:{type:Number,default:0},createdAt:String,updatedAt:String},{versionKey:false,strict:true});
export const Case=mongoose.models.Case||mongoose.model('Case',schema);
const patient=z.object({name:z.string().trim().min(2).max(100),age:z.number().int().min(1).max(120),villageId:z.enum(villages.map(v=>v.id)),language:z.enum(['en','hi']).default('en'),hasSmartphone:z.boolean().default(false),escortNeeded:z.boolean().default(false),escortConfirmed:z.boolean().default(false),transportNeeded:z.boolean().default(false),availableDays:z.array(z.number().int().min(0).max(6)).min(1).max(7),syncConsent:z.boolean().default(false),trainingConsent:z.boolean().default(false),isDemo:z.boolean().default(false)});
const id=z.string().uuid();
function failure(status,message){return Object.assign(new Error(message),{status});}
async function getCase(value){id.parse(value);const doc=await Case.findOne({_id:value,...accessFilter()}).lean();if(!doc)throw failure(404,'Patient record not found.');return doc;}
async function update(doc,version,fields){
  const result=await Case.findOneAndUpdate({_id:doc._id,version},{$set:{...fields,updatedAt:new Date().toISOString()},$inc:{version:1}},{new:true}).lean();
  if(!result)throw failure(409,'Record changed on another device. Refresh before saving.');return result;
}
function authMatches(actual,expected){if(!actual||!expected)return false;const a=Buffer.from(actual),b=Buffer.from(expected);return a.length===b.length&&crypto.timingSafeEqual(a,b);}
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:15*1024*1024,files:1}});
export function makeApp({devMiddleware}={}){
  const app=express();app.disable('x-powered-by');app.use(express.json({limit:'8mb'}));
  app.use((req,res,next)=>{res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');if(req.path.startsWith('/api'))res.setHeader('Cache-Control','no-store');next();});
  app.get('/api/health',async(req,res)=>res.json({ok:mongoose.connection.readyState===1,models:await modelStatus(),syncConfigured:!!process.env.SYNC_TARGET_URL,apiKeyRequired:!!process.env.API_KEY,today:todayIndia()}));
  app.use('/api/auth',authRouter());
  app.use(['/api','/uploads'],sessionMiddleware);
  app.use('/api',chatRouter());
  app.use('/api/sync',(req,res)=>res.status(409).json({error:'Legacy sync disabled until account-aware sync is configured.'}));
  app.get('/api/glaucoma/status',async(req,res)=>res.json(await glaucomaStatus()));
  app.get('/api/disease-models',async(req,res)=>{const status=await modelStatus(),glaucoma=await glaucomaStatus();res.json(diseases.map(d=>{const configured=d.id==='dr'?status.grading:d.id==='glaucoma'?glaucoma.configured:false;return {...d,configured,status:configured?'Research model available':'Coming soon'};}));});
  app.use('/api',directoryRouter());
  app.use('/api/training',(req,res,next)=>{admin();next();},trainingRouter(Case));
  app.use('/api',careRouter({Case,getCase,update}));
  app.use('/api',clinicalRouter({getCase,update}));
  app.get('/api/cases',async(req,res)=>res.json(await Case.find(accessFilter()).sort({createdAt:-1}).limit(1000).lean()));
  app.post('/api/cases',async(req,res)=>{
    const v=z.object({id,patient}).parse(req.body),existing=await Case.findOne({_id:v.id,...accessFilter()}).lean();
    if(existing){if(JSON.stringify(existing.patient)!==JSON.stringify(v.patient))throw failure(409,'Case ID already exists with different patient details.');return res.json(existing);}
    const now=new Date().toISOString();
    try{res.status(201).json((await Case.create({_id:v.id,ownerId:String(currentUser()._id),patient:v.patient,eyes:{},review:null,referral:null,createdAt:now,updatedAt:now})).toObject());}
    catch(e){if(e.code===11000)return res.json(await getCase(v.id));throw e;}
  });
  app.post('/api/cases/share-all',async(req,res)=>{const u=currentUser();if(u.role!=='patient')throw failure(403,'Patient account required.');const v=z.object({doctorId:z.string().regex(/^[a-f0-9]{24}$/),consent:z.literal(true)}).parse(req.body);const doctor=await User.findOne({_id:v.doctorId,role:'doctor',verified:true}).lean();if(!doctor)throw failure(400,'Choose a verified doctor.');const docs=await Case.find({ownerId:String(u._id),authorizedDoctors:{$ne:v.doctorId},...(doctor.isDemo?{'patient.isDemo':true}:{})}).lean();let shared=0;for(const doc of docs){await Case.updateOne({_id:doc._id,ownerId:String(u._id)},{$addToSet:{authorizedDoctors:v.doctorId},$inc:{version:1},$set:{updatedAt:new Date().toISOString()}});shared++;await notify([v.doctorId],doc._id,'A patient shared a report for your review.','मरीज ने समीक्षा के लिए रिपोर्ट साझा की है।');}res.json({shared});});
  app.put('/api/cases/:id/authorization',async(req,res)=>{const doc=await getCase(req.params.id);if(doc.ownerId!==String(currentUser()._id))throw failure(403,'Only the record owner can grant access.');const v=z.object({version:z.number().int().positive(),doctorIds:z.array(z.string().regex(/^[a-f0-9]{24}$/)).max(20),consent:z.literal(true)}).parse(req.body);const count=await User.countDocuments({_id:{$in:v.doctorIds},role:'doctor',verified:true});if(count!==new Set(v.doctorIds).size)throw failure(400,'Choose verified doctors only.');if(!doc.patient.isDemo&&await User.exists({_id:{$in:v.doctorIds},isDemo:true}))throw failure(400,'Demo doctors can access demo patient records only.');const saved=await update(doc,v.version,{authorizedDoctors:[...new Set(v.doctorIds)]});await notify(v.doctorIds.filter(id=>!(doc.authorizedDoctors||[]).includes(id)),doc._id,'A patient shared a report for your review.','मरीज ने समीक्षा के लिए रिपोर्ट साझा की है।');res.json(saved);});
  app.get('/api/cases/:id',async(req,res)=>res.json(await getCase(req.params.id)));
  app.post('/api/cases/:id/eyes/:side',upload.single('image'),async(req,res)=>{
    const side=z.enum(['left','right']).parse(req.params.side),doc=await getCase(req.params.id);
    const version=z.coerce.number().int().positive().parse(req.body.version);
    const disease=z.enum(['dr','glaucoma','amd']).default('dr').parse(req.body.disease);if(disease==='amd'||(disease==='glaucoma'&&!(await glaucomaStatus()).configured))throw failure(503,'Coming soon for this disease. No prediction was generated.');
    if(!req.file)throw failure(400,'Choose a retinal photograph.');
    if(doc.version!==version)throw failure(409,'Refresh this case before analyzing.');
    const clean=await sharp(req.file.buffer,{limitInputPixels:40000000}).rotate().removeAlpha().toColourspace('srgb').jpeg({quality:95}).toBuffer();
    const result={...await analyze(clean),disease:'dr'},glaucoma=await analyzeGlaucoma(clean,side,false),name=`${crypto.randomUUID()}.jpg`;
    await fs.mkdir('uploads',{recursive:true});await fs.writeFile(`uploads/${name}`,clean);
    try{const saved=await update(doc,version,{eyes:{...doc.eyes,[side]:{imagePath:`/uploads/${name}`,result,glaucoma,analyzedAt:new Date().toISOString()}},review:null,referral:doc.referral?{...doc.referral,needsReReview:true,confirmed:false,appointmentStatus:'requested'}:null});await notify([doc.ownerId,...(doc.authorizedDoctors||[])],doc._id,'A new screening image and report are ready for review.','नई स्क्रीनिंग रिपोर्ट समीक्षा के लिए तैयार है।');res.json(saved);}
    catch(e){await fs.unlink(`uploads/${name}`);throw e;}
  });
  app.post('/api/cases/:id/eyes/:side/reanalyze',async(req,res)=>{
    const side=z.enum(['left','right']).parse(req.params.side),doc=await getCase(req.params.id),v=z.object({version:z.number().int().positive()}).parse(req.body),eye=doc.eyes?.[side];
    if(doc.version!==v.version)throw failure(409,'Refresh this case before analyzing.');
    if(!eye?.imagePath||!/^\/uploads\/[a-f0-9-]+\.jpg$/.test(eye.imagePath))throw failure(400,'Original image is unavailable; upload it again.');
    const buffer=await fs.readFile('.'+eye.imagePath),result={...await analyze(buffer),disease:'dr'},glaucoma=await analyzeGlaucoma(buffer,side,false);
    const saved=await update(doc,v.version,{eyes:{...doc.eyes,[side]:{...eye,result,glaucoma,analyzedAt:new Date().toISOString(),findingsDecision:'not_assessed',previousReview:doc.review||eye.previousReview||null}},review:null,referral:doc.referral?{...doc.referral,needsReReview:true,confirmed:false,appointmentStatus:'requested'}:null});
    await notify([doc.ownerId,...(doc.authorizedDoctors||[])],doc._id,'Updated AI segmentation is ready for review.','नया AI विभाजन समीक्षा के लिए तैयार है।');res.json(saved);
  });
  app.post('/api/cases/:id/eyes/:side/glaucoma',async(req,res)=>{
    const side=z.enum(['left','right']).parse(req.params.side),doc=await getCase(req.params.id),v=z.object({version:z.number().int().positive(),operatorConfirmed:z.boolean().default(false)}).parse(req.body),eye=doc.eyes?.[side];
    if(doc.version!==v.version)throw failure(409,'Refresh this case before analyzing.');
    if(!eye?.imagePath||!/^\/uploads\/[a-f0-9-]+\.jpg$/.test(eye.imagePath))throw failure(400,'Original image is unavailable; upload it again.');
    const glaucoma=await analyzeGlaucoma(await fs.readFile('.'+eye.imagePath),side,v.operatorConfirmed);
    res.json(await update(doc,v.version,{eyes:{...doc.eyes,[side]:{...eye,glaucoma}}}));
  });
  app.post('/api/cases/:id/review',async(req,res)=>{
    clinical();
    const v=z.object({version:z.number().int().positive(),reviewer:z.string().trim().min(2).max(100),assessment:z.enum(['refer','routine','unable']),grade:z.number().int().min(0).max(4).nullable(),urgencyDays:z.number().int().min(1).max(90),notes:z.string().max(2000).default(''),eyeGrades:z.object({left:z.number().int().min(0).max(4),right:z.number().int().min(0).max(4)}).optional(),findingsDecision:z.enum(['approved','rejected','not_assessed']).default('not_assessed'),approvedForTraining:z.boolean().default(false)}).parse(req.body),doc=await getCase(req.params.id);
    if(!doc.eyes?.left||!doc.eyes?.right)throw failure(400,'Upload photographs for both eyes before reviewing.');
    if(v.assessment==='routine'&&Object.values(doc.eyes).some(e=>e.result.status==='retake'))throw failure(400,'A rejected image cannot receive a routine screening clearance. Use unable to assess or retake.');
    if(v.approvedForTraining&&(!v.eyeGrades||v.assessment==='unable'||Object.values(doc.eyes).some(e=>e.result.status!=='analyzed')))throw failure(400,'Training approval requires usable images and both eye-specific grades.');
    if(v.assessment==='unable'&&v.grade!==null)throw failure(400,'Unable-to-assess cases must have no confirmed grade.');
    const saved=await update(doc,v.version,{eyes:Object.fromEntries(Object.entries(doc.eyes).map(([side,eye])=>[side,{...eye,findingsDecision:v.findingsDecision,annotations:(eye.annotations||[]).map(a=>({...a,status:v.findingsDecision==='approved'?'approved':v.findingsDecision==='rejected'?'rejected':'pending',confirmedBy:v.findingsDecision==='not_assessed'?null:String(currentUser()._id),confirmedAt:v.findingsDecision==='not_assessed'?null:new Date().toISOString()}))}])),review:{...v,isDemoReviewer:!!currentUser().isDemo,reviewer:currentUser().name,reviewerId:String(currentUser()._id),reviewedAt:new Date().toISOString()},referral:doc.referral?{...doc.referral,needsReReview:true,confirmed:false,appointmentStatus:'requested'}:null});await notify([doc.ownerId],doc._id,'Your doctor reviewed the screening report.','डॉक्टर ने स्क्रीनिंग रिपोर्ट की समीक्षा की है।');res.json(saved);
  });
  app.get('/api/cases/:id/plan',async(req,res)=>{
    const doc=await getCase(req.params.id);if(!doc.review)throw failure(400,'A recorded referral/review decision is required first.');
    res.json(planReferral(doc.patient,doc.review.urgencyDays,todayIndia(),doc.review.reviewedAt.slice(0,10),await getFacilities()));
  });
  app.post('/api/cases/:id/referral',async(req,res)=>{
    const v=z.object({version:z.number().int().positive(),facilityId:z.string(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/)}).parse(req.body),doc=await getCase(req.params.id);
    if(!doc.review)throw failure(400,'Doctor review is required before referral.');
    const option=planReferral(doc.patient,doc.review.urgencyDays,todayIndia(),doc.review.reviewedAt.slice(0,10),await getFacilities()).options.find(f=>f.id===v.facilityId&&f.dates.includes(v.date));
    if(!option)throw failure(400,'That plan is no longer feasible. Refresh referral options.');
    res.json(await update(doc,v.version,{referral:{facilityId:option.id,facilityName:option.name,date:v.date,status:'planned',appointmentStatus:'requested',appointmentTime:'',confirmationReference:'',confirmedBy:'',transportStatus:'needed',missedReason:'',confirmed:false,needsReReview:false,escortOutstanding:option.escortOutstanding,transportNeeded:doc.patient.transportNeeded,history:[...(doc.referral?.history||[]),{status:'requested',at:new Date().toISOString(),facilityId:option.id,date:v.date}]}}));
  });
  app.patch('/api/cases/:id/attendance',async(req,res)=>{
    const v=z.object({version:z.number().int().positive(),status:z.enum(['planned','attended','missed']),reason:z.string().max(500).default('')}).parse(req.body),doc=await getCase(req.params.id);
    if(!doc.referral)throw failure(400,'No referral exists.');
    if(v.status==='attended'&&(!doc.review||doc.referral.needsReReview||!doc.referral.confirmed||doc.referral.appointmentStatus==='cancelled'))throw failure(400,'A current review and hospital-confirmed appointment are required before marking attendance.');
    res.json(await update(doc,v.version,{referral:{...doc.referral,status:v.status,missedReason:v.status==='missed'?v.reason:'',history:[...doc.referral.history,{status:v.status,at:new Date().toISOString(),reason:v.reason}]}}));
  });
  app.post('/api/sync',async(req,res)=>{
    if(!process.env.SYNC_TARGET_URL)return res.status(409).json({error:'Remote sync is not configured. Records are safely stored in local MongoDB. Set SYNC_TARGET_URL and SYNC_TOKEN for a second server.'});
    const target=new URL(process.env.SYNC_TARGET_URL);
    if(target.protocol!=='https:'&&!['127.0.0.1','localhost'].includes(target.hostname))throw failure(400,'Remote sync requires HTTPS.');
    if(!process.env.SYNC_TOKEN)throw failure(400,'Configure a sync token.');
    const docs=await Case.find({'patient.syncConsent':true,$expr:{$gt:['$version','$syncedVersion']}}).limit(100).lean();
    const records=docs.map(({_id,patient,eyes,review,referral,version,createdAt,updatedAt})=>({_id,patient,eyes:Object.fromEntries(Object.entries(eyes||{}).map(([side,e])=>[side,{...e,imagePath:null}])),review,referral,version,createdAt,updatedAt}));
    const response=await fetch(new URL('/api/sync/receive',target),{method:'POST',headers:{'content-type':'application/json','x-sync-token':process.env.SYNC_TOKEN},body:JSON.stringify({records}),signal:AbortSignal.timeout(20000)});
    if(!response.ok)throw failure(502,`Remote server returned ${response.status}; records remain pending.`);
    const data=await response.json();const accepted=z.array(z.string().uuid()).parse(data.accepted);
    for(const doc of docs)if(accepted.includes(doc._id))await Case.updateOne({_id:doc._id,version:doc.version},{$set:{syncedVersion:doc.version}});
    res.json({synced:accepted.length,conflicts:data.conflicts||[],imagesTransferred:false});
  });
  app.get('/api/export',async(req,res)=>res.json({format:'nayansetu-backup-v1',exportedAt:new Date().toISOString(),imageFilesIncluded:false,trips:currentUser().role==='admin'?await Trip.find().lean():[],records:await Case.find(accessFilter()).lean()}));
  app.use('/uploads',async(req,res,next)=>{const imagePath='/uploads'+req.path;const allowed=await Case.exists({...accessFilter(),$or:[{'eyes.left.imagePath':imagePath},{'eyes.right.imagePath':imagePath}]});if(!allowed)return res.status(404).json({error:'Image not found.'});next();});
  app.use('/uploads',express.static('uploads',{fallthrough:false}));
  app.use('/api',(req,res)=>res.status(404).json({error:'API route not found'}));
  if(devMiddleware) app.use(devMiddleware);
  else {
    app.use(express.static('dist'));
    app.get('/{*path}',(req,res)=>res.sendFile('index.html',{root:process.cwd()+'/dist'}));
  }
  app.use((err,req,res,next)=>{const status=err instanceof z.ZodError?400:err.code==='LIMIT_FILE_SIZE'?413:err.status||500;res.status(status).json({error:err instanceof z.ZodError?err.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '):status===500?'The request failed. Check the local server log.':err.message});if(status===500)console.error(err);});
  return app;
}
