import {User,passwordFields} from './auth.mjs';
import 'dotenv/config';
import {createServer} from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import mongoose from 'mongoose';
import {MongoMemoryServer} from 'mongodb-memory-server-core';
import {makeApp} from './app.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');process.chdir(root);
let mongo;
const host=process.env.HOST||'127.0.0.1';
if(host!=='127.0.0.1'&&host!=='localhost'&&!process.env.API_KEY)throw new Error('Set API_KEY before exposing patient records to the local network.');
let uri=process.env.MONGODB_URI;
if(!uri){
  await fs.mkdir('.runtime/mongo',{recursive:true});await fs.mkdir('.runtime/bin',{recursive:true});
  mongo=await MongoMemoryServer.create({binary:{version:'7.0.24',downloadDir:path.join(root,'.runtime/bin')},instance:{dbPath:path.join(root,'.runtime/mongo'),storageEngine:'wiredTiger',ip:'127.0.0.1',dbName:'nayansetu'},spawn:{}});
  uri=mongo.getUri('nayansetu');
}
await mongoose.connect(uri);
if(process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){
 if(process.env.ADMIN_PASSWORD.length<12)throw new Error('Administrator password requires at least 12 characters.');
 const email=process.env.ADMIN_EMAIL.trim().toLowerCase();
 const existingAdmin=await User.findOne({email}).lean();
 if(existingAdmin&&existingAdmin.role!=='admin')throw new Error('Administrator setup email already belongs to a patient or doctor. Choose a NEW email; no account was promoted.');
 if(!existingAdmin)await User.create({email,name:'Administrator',role:'admin',verified:true,...await passwordFields(process.env.ADMIN_PASSWORD)});
}

const port=Number(process.env.PORT||(process.env.NAYANSETU_DEV==='1'?5173:4000));
const server=createServer();
let vite;
if(process.env.NAYANSETU_DEV==='1'){
  const {createServer:createViteServer}=await import('vite');
  const {default:react}=await import('@vitejs/plugin-react');
  vite=await createViteServer({configFile:false,root,plugins:[react()],server:{middlewareMode:true,hmr:{server}},appType:'spa'});
}
server.on('request',makeApp({devMiddleware:vite?.middlewares}));
server.on('error',async error=>{
  console.error(error.code==='EADDRINUSE'?'This port is already in use. Stop the previous npm start / npm run dev window with Ctrl+C and retry.':error);
  await shutdown(1);
});
server.listen(port,host,()=>console.log('NayanSetu ready: http://'+host+':'+port+' · interface + API · MongoDB connected'));
let stopping=false;
async function shutdown(code=0){if(stopping)return;stopping=true;server.close();if(vite)await vite.close();await mongoose.disconnect();if(mongo)await mongo.stop({doCleanup:false,force:false});process.exit(code);}
process.on('SIGINT',()=>shutdown());process.on('SIGTERM',()=>shutdown());
