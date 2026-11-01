import fs from 'node:fs/promises';
import express from 'express';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import {promisify} from 'node:util';
import {AsyncLocalStorage} from 'node:async_hooks';
import {z} from 'zod';
const scrypt=promisify(crypto.scrypt),scope=new AsyncLocalStorage();
export const User=mongoose.models.User||mongoose.model('User',new mongoose.Schema({name:String,email:{type:String,unique:true},password:String,salt:String,role:String,verified:{type:Boolean,default:false},registration:String,specialization:String,hospital:String,contact:String,isDemo:{type:Boolean,default:false},verificationKind:String,verifiedById:String,verifiedAt:String},{timestamps:true}));
const Session=mongoose.models.Session||mongoose.model('Session',new mongoose.Schema({token:{type:String,unique:true},user:mongoose.Schema.Types.ObjectId,expires:{type:Date,index:{expires:0}}}));
const hash=v=>crypto.createHash('sha256').update(v).digest('hex');
const fail=(status,message)=>Object.assign(new Error(message),{status});
export const currentUser=()=>scope.getStore();
export function accessFilter(){const u=currentUser();if(!u)throw fail(401,'Login required.');if(u.role==='doctor'&&!u.verified)throw fail(403,'Doctor verification pending.');return u.role==='admin'?{}:u.role==='patient'?{ownerId:String(u._id)}:{authorizedDoctors:String(u._id),...(u.isDemo?{'patient.isDemo':true}:{})};}
export function clinical(){const u=currentUser();if(!u||u.role!=='doctor'||!u.verified)throw fail(403,'Verified doctor access required.');}
export function admin(){if(currentUser()?.role!=='admin')throw fail(403,'Administrator access required.');}
export async function passwordsMatch(password,user){const actual=await scrypt(password,user.salt,64),expected=Buffer.from(user.password,'hex');return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);}
export async function passwordFields(password){const salt=crypto.randomBytes(24).toString('hex');return {salt,password:(await scrypt(password,salt,64)).toString('hex')};}
const publicUser=u=>({id:String(u._id),name:u.name,email:u.email,role:u.role,verified:u.verified,specialization:u.specialization,hospital:u.hospital,isDemo:!!u.isDemo,verificationKind:u.verificationKind||null,verifiedById:u.verifiedById||null});
// Only credential endpoints consume authentication limits. Session polling and logout never do.
export function createAuthLimiter({max=40,windowMs=900000,failuresOnly=false,now=Date.now}={}){
 const attempts=new Map();
 return (req,res,next)=>{
  const key=req.socket.remoteAddress||'unknown',time=now();
  for(const [k,v]of attempts)if(v.until<=time)attempts.delete(k);
  const entry=attempts.get(key);
  if(entry&&entry.count>=max){const retryAfter=Math.max(1,Math.ceil((entry.until-time)/1000));res.setHeader('Retry-After',String(retryAfter));return res.status(429).json({error:`Too many ${failuresOnly?'failed login':'registration'} attempts. Try again in ${Math.ceil(retryAfter/60)} minute(s).`,retryAfter});}
  const count=()=>{const time=now(),entry=attempts.get(key);if(!entry||entry.until<=time)attempts.set(key,{count:1,until:time+windowMs});else entry.count++;};
  if(failuresOnly)res.once('finish',()=>{if(res.statusCode>=400&&res.statusCode!==429)count();});else count();
  next();
 };
}
export function authRouter(){const router=express.Router();
 const loginLimit=createAuthLimiter({failuresOnly:true}),registerLimit=createAuthLimiter();
 router.post('/register',registerLimit,async(req,res)=>{const v=z.object({name:z.string().trim().min(2).max(100),email:z.string().email().max(200).transform(v=>v.toLowerCase()),password:z.string().min(6).max(200),role:z.enum(['patient','doctor']),registration:z.string().max(100).optional(),specialization:z.string().max(100).optional(),hospital:z.string().max(200).optional(),contact:z.string().max(100).optional()}).parse(req.body);if(v.role==='doctor'&&(!v.registration||!v.specialization||!v.hospital||!v.contact))throw fail(400,'Doctor registration, specialization, hospital and contact are required.');const {password,...profile}=v;try{const user=await User.create({...profile,...await passwordFields(password),verified:false});res.status(201).json(publicUser(user));}catch(e){if(e.code===11000)throw fail(409,'Account could not be registered with those details.');throw e;}});
 router.post('/login',loginLimit,async(req,res)=>{const v=z.object({email:z.string().email().transform(v=>v.toLowerCase()),password:z.string().max(200)}).parse(req.body),user=await User.findOne({email:v.email});if(!user||!await passwordsMatch(v.password,user))throw fail(401,'Email or password is incorrect.');const token=crypto.randomBytes(32).toString('hex');await Session.create({token:hash(token),user:user._id,expires:new Date(Date.now()+8*3600000)});res.setHeader('Set-Cookie',`ns_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`);res.json(publicUser(user));});
 router.get('/me',sessionMiddleware,(req,res)=>res.json(publicUser(currentUser())));
 router.post('/logout',sessionMiddleware,async(req,res)=>{await Session.deleteOne({token:hash(cookie(req))});res.setHeader('Set-Cookie','ns_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');res.json({ok:true});});
 router.get('/doctors',sessionMiddleware,async(req,res)=>res.json((await User.find({role:'doctor',verified:true}).lean()).map(publicUser)));
 router.get('/demo-doctors',sessionMiddleware,async(req,res)=>{
  admin();const presets=JSON.parse(await fs.readFile(new URL('./demo-doctors.json',import.meta.url),'utf8'));
  res.json({presets,accounts:(await User.find({role:'doctor',isDemo:true,email:{$in:presets.map(p=>p.email)}}).lean()).map(publicUser)});
 });
 router.post('/demo-doctors',sessionMiddleware,async(req,res)=>{
  admin();const {resetPasswords}=z.object({resetPasswords:z.boolean().default(false)}).parse(req.body||{});
  const presets=JSON.parse(await fs.readFile(new URL('./demo-doctors.json',import.meta.url),'utf8')),credentials=[],accounts=[];
  for(const preset of presets){
   let user=await User.findOne({email:preset.email});
   if(user&&(!user.isDemo||user.role!=='doctor'))throw fail(409,'A preset email belongs to a non-demo account. It was not modified.');
   if(!user||resetPasswords){
    const password='Demo-'+crypto.randomBytes(15).toString('base64url'),fields={...preset,role:'doctor',isDemo:true,verified:true,verificationKind:'demo_access_only',verifiedById:String(currentUser()._id),verifiedAt:new Date().toISOString(),...await passwordFields(password)};
    if(user){await User.updateOne({_id:user._id,isDemo:true},{$set:fields});await Session.deleteMany({user:user._id});user=await User.findById(user._id);}else user=await User.create(fields);
    credentials.push({name:user.name,email:user.email,temporaryPassword:password});
   }
   accounts.push(publicUser(user));
  }
  res.json({accounts,credentials,message:'Fictional demo accounts only. Administrator approved test access; no real medical credentials were verified.'});
 });
 router.get('/pending-doctors',sessionMiddleware,async(req,res)=>{admin();res.json((await User.find({role:'doctor',verified:false}).lean()).map(u=>({...publicUser(u),registration:u.registration,contact:u.contact})));});
 router.post('/doctors/:id/verify',sessionMiddleware,async(req,res)=>{admin();const v=z.object({verified:z.boolean()}).parse(req.body);if(!mongoose.isValidObjectId(req.params.id))throw fail(400,'Invalid doctor ID');const u=await User.findOneAndUpdate({_id:req.params.id,role:'doctor'},{$set:v},{new:true});if(!u)throw fail(404,'Doctor not found.');res.json(publicUser(u));});
 return router;
}
function cookie(req){return (req.headers.cookie||'').split(';').map(s=>s.trim()).find(s=>s.startsWith('ns_session='))?.slice(11)||'';}
export async function sessionMiddleware(req,res,next){const token=cookie(req);if(!/^[a-f0-9]{64}$/.test(token))throw fail(401,'Login required.');const session=await Session.findOne({token:hash(token),expires:{$gt:new Date()}}).lean(),user=session&&await User.findById(session.user).lean();if(!user)throw fail(401,'Session expired. Log in again.');if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.origin&&req.headers.origin!==`${req.protocol}://${req.headers.host}`)throw fail(403,'Cross-origin request rejected.');scope.run(user,()=>next());}
