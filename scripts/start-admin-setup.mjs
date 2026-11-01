import readline from 'node:readline/promises';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
process.chdir(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'));
const rl=readline.createInterface({input:process.stdin,output:process.stdout});
const email=(await rl.question('Choose a NEW administrator email: ')).trim().toLowerCase();
rl.close();
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('Enter a valid email address.');
if(!process.stdin.isTTY)throw new Error('Run this command in an interactive terminal.');
process.stdout.write('Choose an administrator password (12+ characters; hidden): ');
const password=await new Promise((resolve,reject)=>{
 let value='';
 process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
 const finish=()=>{process.stdin.off('data',onData);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');};
 function onData(data){for(const c of data){
  if(c==='\u0003'){finish();reject(new Error('Setup cancelled.'));return;}
  if(c==='\r'||c==='\n'){finish();resolve(value);return;}
  if(c==='\u007f'||c==='\b'){value=value.slice(0,-1);continue;}
  if(c>=' '&&c!=='\u001b')value+=c;
 }}
 process.stdin.on('data',onData);
});
if(password.length<12)throw new Error('Administrator password requires at least 12 characters.');
console.log('Starting NayanSetu. Log in with the administrator credentials you just chose.');
console.log('An existing account is never promoted. If this email is already registered, restart setup with a new email.');
const child=spawn(process.execPath,['scripts/dev.mjs'],{stdio:'inherit',env:{...process.env,ADMIN_EMAIL:email,ADMIN_PASSWORD:password},windowsHide:true});
child.on('error',error=>{console.error(error.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code??1;});
process.on('SIGINT',()=>{if(child.exitCode===null)child.kill('SIGINT');});
