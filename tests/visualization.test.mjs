import test from 'node:test';
import assert from 'node:assert/strict';
import {boxFor,cropFor,visibleFindings,diseases,lesionCategories} from '../shared/visualization.mjs';
test('Crops stay within the source image and contain the marked region',()=>{
 for(const region of [{x:.03,y:.04,rx:.02,ry:.03},{x:.98,y:.96,rx:.02,ry:.04},{x:.5,y:.5,rx:.2,ry:.1}]){
  const box=boxFor(region),crop=cropFor(region);
  assert.ok(crop.x>=0&&crop.y>=0&&crop.x+crop.width<=1.000001&&crop.y+crop.height<=1.000001);
  assert.ok(crop.x<=box.x+.00001&&crop.y<=box.y+.00001);assert.ok(crop.x+crop.width>=box.x+box.width-.00001&&crop.y+crop.height>=box.y+box.height-.00001);
 }
});
test('Unreliable masks never create crops; doctor marks retain category and review status',()=>{
 const eye={result:{masks:{MA:{coveragePct:74,regions:[{x:.5,y:.5,rx:.1,ry:.1}]}}},annotations:[{x:.4,y:.4,rx:.02,ry:.03,category:'SE',status:'approved',label:'Doctor-confirmed test annotation'},{x:.2,y:.2,rx:.02,ry:.03,category:'HE',status:'rejected',label:'Rejected test'}]};
 const findings=visibleFindings(eye);assert.equal(findings.length,1);assert.equal(findings[0].source,'doctor-confirmed');assert.equal(findings[0].category,'SE');assert.equal(visibleFindings(eye,{SE:false}).length,0);
});
test('Three disease modules and required lesion colors are explicit',()=>{
 assert.deepEqual(diseases.map(d=>d.id),['dr','glaucoma','amd']);assert.equal(lesionCategories.MA.color,'#ff4d59');assert.equal(lesionCategories.HE.color,'#ff923f');assert.equal(lesionCategories.EX.color,'#ffe065');assert.equal(lesionCategories.SE.color,'#6be28a');
});

test('Doctor rejection suppresses automatic locations even when the model mask is small',()=>{
 const eye={findingsDecision:'rejected',result:{masks:{MA:{coveragePct:.3,regions:[{x:.4,y:.4,rx:.02,ry:.02}]}}}};
 assert.equal(visibleFindings(eye).length,0);
});
