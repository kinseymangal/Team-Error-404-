import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {segmentOpticDisc} from '../server/optic-segmentation.mjs';
test('Actual optic-disc model returns localized image-specific anatomy and withholds unreliable cup masks',async()=>{
 const a=await segmentOpticDisc(await fs.readFile('public/samples/IDRiD_55.jpg'));
 const b=await segmentOpticDisc(await fs.readFile('public/samples/IDRiD_07.jpg'));
 for(const r of [a,b]){
  assert.equal(r.status,'experimental-disc-only');assert.equal(r.clinicalValidation,false);
  assert.equal(r.cupStatus,'withheld-low-validation-dice');assert.equal(r.masks.cup,undefined);
  assert.ok(r.masks.disc.pixels>500&&r.masks.disc.pixels<512*512*.15);
  const box=r.masks.disc.box;assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=1&&box.y+box.height<=1);
 }
 assert.notEqual(a.masks.disc.mask,b.masks.disc.mask);
});
