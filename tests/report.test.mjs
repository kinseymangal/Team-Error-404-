import test from 'node:test';
import assert from 'node:assert/strict';
import {connectedRegions,maskSummary,explainEye} from '../shared/report.mjs';
import {transportGroups} from '../server/care.mjs';
import {planReferral,facilities} from '../server/domain.mjs';
test('Broad and near-identical lesion masks cannot produce defect circles',()=>{
 const s=maskSummary(Object.fromEntries(['MA','HE','EX'].map(c=>[c,{coveragePct:74,regions:[{x:.5,y:.5}]}])));assert.equal(s.status,'unreliable');assert.equal(s.regions.length,0);
 assert.equal(maskSummary({MA:{coveragePct:6},HE:{coveragePct:6.1},EX:{coveragePct:6.2}}).rejected,true);
});
test('Connected components preserve normalized image coordinates and separate findings',()=>{
 const mask=new Uint8Array(100*50);for(let y=10;y<14;y++)for(let x=20;x<24;x++)mask[y*100+x]=255;
 for(let y=30;y<34;y++)for(let x=70;x<74;x++)mask[y*100+x]=255;
 const regions=connectedRegions(mask,100,50);assert.equal(regions.length,2);assert.equal(regions[0].x,.22);assert.equal(regions[0].y,.24);assert.equal(regions[1].x,.72);assert.equal(regions[0].pixels,16);
});
test('Guidance changes with each eye result, quality, review and language',()=>{
 const eye={result:{status:'analyzed',grade:2,uncertain:true,quality:{sharpness:56,brightness:57,coverage:80},masks:{MA:{coveragePct:74}}}};
 const en=explainEye(eye,null,'left').join(' '),hi=explainEye(eye,null,'right','hi').join(' ');
 assert.match(en,/grade 2/);assert.match(en,/unreliable/);assert.match(en,/sharpness 56/);assert.match(hi,/दाईं आँख/);assert.doesNotMatch(hi,/Doctor review is pending/);
 const retake=explainEye({result:{status:'retake'}},null,'left').join(' ');assert.match(retake,/no disease grade/);assert.doesNotMatch(retake,/grade 2/);
 const reviewed=explainEye(eye,{reviewer:'Dr Test',assessment:'refer',grade:3,urgencyDays:7,notes:'Specific review note'},'left').join(' ');assert.match(reviewed,/Specific review note/);assert.match(reviewed,/grade: 3/);
});
test('Transport groups combine same area/date/hospital and count escort seats',()=>{
 const c=(id,area,status='planned')=>({_id:id,patient:{name:id,villageId:area,transportNeeded:true,escortNeeded:true},referral:{facilityId:'h',date:'2026-11-01',status}});
 const groups=transportGroups([c('a','one'),c('b','one'),c('c','two'),c('d','one','attended')]);assert.equal(groups.length,2);assert.equal(groups[0].seats,4);assert.equal(groups[0].members.length,2);
});
test('Published opening days are suggestions and the review deadline does not roll forward',()=>{
 const plan=planReferral({availableDays:[1,2,3,4,5,6],transportNeeded:true},7,'2026-11-03','2026-11-01');assert.equal(plan.deadline,'2026-11-08');assert.ok(plan.options.length);assert.ok(plan.options.every(f=>f.dates.every(d=>d<='2026-11-08')));assert.ok(facilities.every(f=>f.sourceUrl.startsWith('https:')&&f.seats===null));
 assert.equal(planReferral({availableDays:[1,2,3,4,5,6]},7,'2026-11-10','2026-11-01').options.length,0);
});

test('A broad category is withheld without discarding other localized model outputs',()=>{
 const summary=maskSummary({EX:{coveragePct:18,suppressed:true,regions:[]},HE:{coveragePct:1,regions:[{x:.4,y:.5}]},MA:{coveragePct:0,regions:[]},SE:{coveragePct:0,regions:[]}});
 assert.equal(summary.status,'partial');assert.equal(summary.rejected,false);assert.deepEqual(summary.suppressedCodes,['EX']);assert.equal(summary.regions.length,1);assert.equal(summary.regions[0].code,'HE');
});
