import test from 'node:test';
import assert from 'node:assert/strict';
import {modelStatus} from '../server/inference.mjs';
test('Active weights match the evaluation manifest without claiming independent clinical validation',async()=>{
 const status=await modelStatus();
 assert.equal(status.validation.weightsMatch,true);
 assert.equal(status.validation.trainingComplete,true);
 assert.equal(status.validation.replacementActivated,false);
 assert.equal(status.validation.independentValidation,false);
 assert.equal(status.clinicalValidation,false);
 assert.equal(status.calibrated,false);
 assert.equal((await modelStatus()).validation.status,'research-evaluated-not-clinically-validated');
});
