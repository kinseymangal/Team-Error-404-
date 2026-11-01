// Usage: node scripts/prepare-glaucoma.mjs DATA_DIRECTORY CACHE_DIRECTORY
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
const [source,cache]=process.argv.slice(2);
if(!source||!cache)throw new Error('Specify data directory and cache directory');
await fs.mkdir(cache,{recursive:true});
const images=(await fs.readdir(source)).filter(n=>/^RET\d+(OD|OS)\.jpg$/i.test(n)).sort();
for(let i=0;i<images.length;i++){
 const name=images[i];
 await sharp(path.join(source,name)).rotate().flatten({background:'#000'}).toColourspace('srgb').removeAlpha().resize(224,224,{fit:'contain',background:'#000',kernel:'linear'}).png().toFile(path.join(cache,name.replace(/\.jpg$/i,'.png')));
 if(i%80===0)console.log('Prepared actual fundus photographs',i+1,'/',images.length);
}
await fs.writeFile(path.join(cache,'preprocessing.json'),JSON.stringify({images:images.length,size:224,format:'RGB',fit:'contain',kernel:'linear',normalization:'ImageNet RGB mean/std',input:'FundusImages originals only; no expert overlays or clinical variables'}));
