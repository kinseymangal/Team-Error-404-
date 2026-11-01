import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { IMAGE_SIZE, MAX_BYTES } from '../shared/constants.js';

export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export class InputError extends Error { constructor(message) { super(message); this.status = 400; } }

export async function decodeImage(bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_BYTES) throw new InputError('Choose a JPEG, PNG or WebP up to 15 MB.');
  try {
    const metadata = await sharp(bytes, {limitInputPixels: 25_000_000, failOn: 'warning'}).metadata();
    if (!['jpeg','png','webp'].includes(metadata.format) || (metadata.pages || 1) !== 1) throw new Error('format');
    const decoded = await sharp(bytes, {limitInputPixels: 25_000_000, failOn: 'warning'})
      .rotate().flatten({background:'#000000'}).toColourspace('srgb').removeAlpha().raw().toBuffer({resolveWithObject:true});
    const {width, height} = decoded.info;
    const raw = decoded.data;
    let sum = 0, squares = 0;
    // Subsample luminance for a basic technical check, not clinical gradability.
    const stride = Math.max(1, Math.floor(width * height / 16384));
    let count = 0;
    for (let pixel = 0; pixel < width * height; pixel += stride) {
      const index = pixel * 3;
      const y = .299*raw[index]+.587*raw[index+1]+.114*raw[index+2];
      sum += y; squares += y*y; count++;
    }
    const mean = sum/count, deviation = Math.sqrt(Math.max(0,squares/count-mean*mean));
    const issues = [];
    if (Math.min(width,height)<224) issues.push('Minimum image dimension is below 224 pixels.');
    if (deviation<8) issues.push('Image has very low variation.');
    if (mean<15 || mean>240) issues.push('Image appears severely underexposed or overexposed.');
    const pixels = await sharp(raw,{raw:{width,height,channels:3}})
      .resize(IMAGE_SIZE,IMAGE_SIZE,{fit:'contain',background:'#000000',kernel:'linear'}).raw().toBuffer();
    return {pixels,width,height,image_sha256:hash(bytes),pixel_sha256:hash(Buffer.concat([Buffer.from(`${width}x${height}:`),raw])),
      quality:{width,height,technical_check_passed:issues.length===0,issues,
        limitation:'Basic checks do not verify fundus content, optic-disc visibility or clinical gradability.'}};
  } catch (error) {
    if (error instanceof InputError) throw error;
    throw new InputError('Image is corrupt, unsupported, animated or exceeds the 25-megapixel limit.');
  }
}
