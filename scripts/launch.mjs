import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
console.log('Starting NayanSetu. Keep this window open while using the prototype.');
console.log('First launch may download the local MongoDB runtime. Later launches work without internet.');
const child=spawn(process.execPath,['server/index.mjs'],{cwd:root,stdio:['inherit','pipe','inherit'],windowsHide:true});
let opened=false;
child.stdout.on('data',chunk=>{
  const text=chunk.toString();process.stdout.write(text);
  if(!opened&&text.includes('NayanSetu ready:')){
    opened=true;
    const url=text.match(/http:\/\/[^\s]+/)?.[0]||'http://127.0.0.1:4000';
    if(process.platform==='win32')spawn('rundll32.exe',['url.dll,FileProtocolHandler',url],{stdio:'ignore',windowsHide:true}).unref();
    else console.log(`Open ${url} in your browser.`);
  }
});
child.on('error',e=>{console.error(e.message);process.exitCode=1;});
child.on('exit',code=>{process.exitCode=code||0;});
process.on('SIGINT',()=>{child.kill('SIGINT');process.exit();});
