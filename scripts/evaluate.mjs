// Local evaluation only. Does not train or replace any model.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {analyze} from '../server/inference.mjs';
import {classificationMetrics} from '../shared/metrics.mjs';
const file=process.argv[2],output=process.argv[3]||'evaluation-results.json';
if(!file)throw new Error('Usage: npm run evaluate -- path/to/test-manifest.json [output.json]');
const manifest=JSON.parse(await fs.readFile(file,'utf8'));
if(!Array.isArray(manifest.test)||!manifest.test.length)throw new Error('Manifest requires a non-empty test array: image, grade, patientGroup.');
const root=path.dirname(path.resolve(file)),trainingGroups=new Set((manifest.training||[]).map(r=>r.patientGroup)),trainingHashes=new Set(),seen=new Set(),rows=[],rejected=[];
for(const r of manifest.training||[]){if(!r.patientGroup)throw new Error('Training patientGroup required');trainingHashes.add(crypto.createHash('sha256').update(await fs.readFile(path.resolve(root,r.image))).digest('hex'));}
for(const r of manifest.test){
 if(!Number.isInteger(r.grade)||r.grade<0||r.grade>4||!r.patientGroup)throw new Error('Every test entry needs grade 0–4 and patientGroup.');
 if(trainingGroups.has(r.patientGroup))throw new Error('Patient overlap between training and test sets.');
 const bytes=await fs.readFile(path.resolve(root,r.image)),hash=crypto.createHash('sha256').update(bytes).digest('hex');
 if(trainingHashes.has(hash)||seen.has(hash))throw new Error('Duplicate image within test set or across training/test sets.');seen.add(hash);
 const result=await analyze(bytes);
 if(result.status!=='analyzed'){rejected.push({sha256:hash,actual:r.grade,status:result.status});continue;}
 rows.push({sha256:hash,actual:r.grade,predicted:result.grade,probabilities:result.probabilities,modelVersion:result.modelVersion});
}
const report={generatedAt:new Date().toISOString(),metrics:rows.length?classificationMetrics(rows):null,total:manifest.test.length,rejected,rows,limitations:'Metrics apply only to accepted images in the supplied manifest. Pretrained model provenance must be checked separately for dataset overlap. This tool cannot certify that this is an independent test set or establish clinical validity.'};
await fs.writeFile(output,JSON.stringify(report,null,2));console.log(JSON.stringify({output,total:report.total,evaluated:rows.length,rejected:rejected.length,metrics:report.metrics},null,2));
