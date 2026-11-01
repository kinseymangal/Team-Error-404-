import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
await fs.mkdir('models', { recursive: true });
await fs.mkdir('data/training', { recursive: true });
await fs.mkdir('public/samples', { recursive: true });
export async function download(url, dest) {
  try { if ((await fs.stat(dest)).size > 0) return; } catch {}
  const res = await fetch(url, { signal: AbortSignal.timeout(180000) });
  if (!res.ok) throw new Error(`Download ${res.status}: ${url}`);
  await fs.mkdir(path.dirname(dest), { recursive: true });
  await pipeline(Readable.fromWeb(res.body), (await import('node:fs')).createWriteStream(dest + '.partial'));
  await fs.rename(dest + '.partial', dest);
  console.log('Downloaded', dest);
}
const revision = '904babc43d877b17335892969abbb910677ffe84';
await download(`https://huggingface.co/Shadow0482/iris-onnx/resolve/${revision}/iris-vit.onnx`, 'models/grader-original.onnx');
await download(`https://huggingface.co/Shadow0482/iris-onnx/raw/${revision}/README.md`, 'models/GRADER_SOURCE.md');
const provenance = { source: 'Shadow0482/iris-onnx', revision,
  sha256: crypto.createHash('sha256').update(await fs.readFile('models/grader-original.onnx')).digest('hex'),
  preprocessing: {size:224,mean:[0.485,0.456,0.406],std:[0.229,0.224,0.225]},
  limitations: 'Third-party APTOS research weights. No independent clinical validation performed. Output probabilities are not calibrated confidence.' };
await fs.writeFile('models/provenance.json', JSON.stringify(provenance,null,2));
await import('./prepare-cam.mjs');

// Original IDRiD photographs/annotations obtained from a version-pinned research mirror.
// Retain original attribution; training data are excluded from the distributable source zip.
const base='https://huggingface.co/raiyanz/diabetic-retinopathy-analysis/resolve/d2b16fd3f9177e102ebf8af9d3d1aa4f9eef252a/';
for (let n=1;n<=8;n++) {
  const id=`IDRiD_${String(n).padStart(2,'0')}`;
  const img=`dataset/A. Segmentation/1. Original Images/a. Training Set/${id}.jpg`;
  await download(base+img.split('/').map(encodeURIComponent).join('/'),`data/training/${id}.jpg`);
  for (const [code,folder] of [['MA','1. Microaneurysms'],['HE','2. Haemorrhages'],['EX','3. Hard Exudates']]) {
    const mask=`dataset/A. Segmentation/2. All Segmentation Groundtruths/a. Training Set/${folder}/${id}_${code}.tif`;
    await download(base+mask.split('/').map(encodeURIComponent).join('/'),`data/training/${id}_${code}.tif`);
  }
}
const test=`dataset/A. Segmentation/1. Original Images/b. Testing Set/IDRiD_55.jpg`;
await download(base+test.split('/').map(encodeURIComponent).join('/'),'public/samples/IDRiD_55.jpg');
const sharp=(await import('sharp')).default;
await sharp('public/samples/IDRiD_55.jpg').resize(1200).jpeg({quality:90}).toFile('public/samples/fundus.jpg');
await sharp('public/samples/fundus.jpg').blur(12).jpeg().toFile('public/samples/blurred.jpg');
console.log('Model and training data ready. Run npm run train:lesions, then npm run build and npm start.');
