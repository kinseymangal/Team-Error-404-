import test from 'node:test';
import assert from 'node:assert/strict';
import {classificationMetrics} from '../shared/metrics.mjs';
test('Five-class metrics return perfect scores only for perfect predictions',()=>{const m=classificationMetrics(Array.from({length:5},(_,i)=>({actual:i,predicted:i})));assert.equal(m.macroF1,1);assert.equal(m.quadraticWeightedKappa,1);assert.equal(m.accuracy,1);assert.deepEqual(m.missingClasses,[]);});
test('Collapsed predictions expose per-class failures without forcing class diversity',()=>{const m=classificationMetrics(Array.from({length:5},(_,i)=>({actual:i,predicted:2})));assert.equal(m.accuracy,.2);assert.equal(m.perClass[0].recall,0);assert.equal(m.perClass[2].precision,.2);assert.equal(m.quadraticWeightedKappa,0);});
test('Missing classes and invalid labels are explicit',()=>{assert.deepEqual(classificationMetrics([{actual:0,predicted:0}]).missingClasses,[1,2,3,4]);assert.throws(()=>classificationMetrics([{actual:5,predicted:0}]));});
