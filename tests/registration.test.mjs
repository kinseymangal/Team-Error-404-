import test from 'node:test';
import assert from 'node:assert/strict';
import {ensureRegisteredForAnalysis} from '../src/registration.mjs';
const patient={name:'Demo patient'};
const draft={_id:'same-case-id',version:0,patient};
test('Browser-only registration is persisted with the same ID before analysis',async()=>{
  const calls=[],removed=[];
  const doc=await ensureRegisteredForAnalysis(draft,{request:async(url,options)=>{calls.push([url,JSON.parse(options.body)]);return {...draft,version:1};},removeQueued:async id=>removed.push(id)});
  assert.equal(doc.version,1);assert.deepEqual(calls,[['/api/cases',{id:draft._id,patient}]]);assert.deepEqual(removed,[draft._id]);
});
test('Cached registration refreshes its server version before an upload',async()=>{
  const result=await ensureRegisteredForAnalysis({...draft,version:1},{request:async url=>{assert.equal(url,'/api/cases/same-case-id');return {...draft,version:4};},removeQueued:async()=>{}});assert.equal(result.version,4);
});
test('Unreachable server retains the queued registration and reports how to reconnect',async()=>{
  let removed=false;
  await assert.rejects(()=>ensureRegisteredForAnalysis(draft,{request:async()=>{throw new TypeError('fetch failed');},removeQueued:async()=>{removed=true;}}),/npm.cmd start/);assert.equal(removed,false);assert.equal(draft.version,0);
});
test('Server validation errors are preserved and the registration stays queued',async()=>{
  let removed=false;
  await assert.rejects(()=>ensureRegisteredForAnalysis(draft,{request:async()=>{throw Object.assign(new Error('Camp API key required'),{status:401});},removeQueued:async()=>{removed=true;}}),/API key required/);assert.equal(removed,false);
});
test('A missing record can be registered again after switching local databases',async()=>{
  const calls=[];
  const doc=await ensureRegisteredForAnalysis({...draft,version:3},{request:async(url)=>{calls.push(url);if(calls.length===1)throw Object.assign(new Error('Not found'),{status:404});return {...draft,version:1};},removeQueued:async()=>{}});assert.equal(doc.version,1);assert.deepEqual(calls,['/api/cases/same-case-id','/api/cases']);
});
