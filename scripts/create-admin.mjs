import 'dotenv/config';
import mongoose from 'mongoose';
import {User,passwordFields} from '../server/auth.mjs';
if(!process.env.MONGODB_URI||!process.env.ADMIN_EMAIL||!process.env.ADMIN_PASSWORD||process.env.ADMIN_PASSWORD.length<12)throw new Error('Set MONGODB_URI, ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) in your terminal environment.');
await mongoose.connect(process.env.MONGODB_URI);
await User.create({name:'Administrator',email:process.env.ADMIN_EMAIL.toLowerCase(),role:'admin',verified:true,...await passwordFields(process.env.ADMIN_PASSWORD)});
await mongoose.disconnect();console.log('Administrator created. Clear ADMIN_PASSWORD from your terminal environment.');
