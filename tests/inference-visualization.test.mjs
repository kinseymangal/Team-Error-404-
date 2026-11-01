import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import sharp from 'sharp';
import {analyze} from '../server/inference.mjs';
test('Two different retinal photographs generate their own model outputs and valid transparent heatmaps',async()=>{
 const a=await analyze(await fs.readFile('public/samples/IDRiD_07.jpg')),b=await analyze(await fs.readFile('public/samples/IDRiD_55.jpg'));
 assert.equal(a.status,'analyzed');assert.equal(b.status,'analyzed');assert.notEqual(a.imageSha256,b.imageSha256);assert.notEqual(a.heatmap,b.heatmap);assert.notEqual(a.masks.EX.mask,b.masks.EX.mask);assert.ok(Object.values(b.masks).some(m=>m.regions.length>0));
 for(const result of [a,b]){assert.equal(result.probabilities.length,5);assert.ok(result.probabilities.every(p=>Number.isFinite(p)&&p>=0&&p<=1));const heat=await sharp(Buffer.from(result.heatmap.split(',')[1],'base64')).metadata();assert.equal(heat.width,224);assert.equal(heat.height,224);assert.equal(heat.channels,4);for(const mask of Object.values(result.masks)){assert.match(mask.mask,/^data:image\/png;base64,/);if(mask.suppressed)assert.equal(mask.regions.length,0);}}
});
