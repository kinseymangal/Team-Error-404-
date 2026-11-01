import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareReport} from '../src/prepare-report.mjs';
test('Print completes both pending glaucoma eyes using consecutive saved versions without inventing operator approval',async()=>{
 let doc={_id:'case',version:2,eyes:{left:{imagePath:'/uploads/l.jpg',glaucoma:{status:'review_required'}},right:{imagePath:'/uploads/r.jpg',glaucoma:{status:'review_required'}}}};
 const calls=[];
 const request=async(url,options)=>{
  if(url==='/api/cases/case')return structuredClone(doc);
  if(url==='/api/glaucoma/status')return {configured:true,researchTestMode:true};
  const body=JSON.parse(options.body);assert.equal(body.version,doc.version);assert.equal(body.operatorConfirmed,false);
  const side=url.includes('/left/')?'left':'right';calls.push(side);doc={...doc,version:doc.version+1,eyes:{...doc.eyes,[side]:{...doc.eyes[side],glaucoma:{status:'research_prediction',scores:[{score:.3},{score:.7}],heatmap:'data:image/png;base64,test'}}}};return structuredClone(doc);
 };
 const result=await prepareReport(doc,{disease:'combined',request});assert.deepEqual(calls,['left','right']);assert.equal(result.version,4);assert.equal(result.eyes.right.glaucoma.scores.length,2);
});
test('Print does not silently export pending glaucoma predictions when the model is unavailable',async()=>{
 const doc={_id:'case',eyes:{left:{imagePath:'/uploads/l.jpg'}}};
 await assert.rejects(prepareReport(doc,{disease:'glaucoma',request:async url=>url.includes('/cases/')?doc:{configured:false}}),/unavailable/);
});
test('A quality-rejected eye is retained with its retake reason instead of fabricated maps',async()=>{
 const doc={_id:'case',eyes:{left:{imagePath:'/uploads/l.jpg',glaucoma:{status:'recapture',quality:{issues:['Blurred']}}}}};
 const result=await prepareReport(doc,{disease:'glaucoma',request:async url=>url.includes('/cases/')?doc:{configured:true,researchTestMode:true}});
 assert.equal(result.eyes.left.glaucoma.heatmap,undefined);assert.equal(result.eyes.left.glaucoma.status,'recapture');
});
