import path from 'node:path';
import {importFolder} from '../server/training.mjs';
if(!process.argv[2])throw new Error('Usage: npm run import:aptos -- "C:\\path\\to\\extracted-aptos"');
console.log(await importFolder(path.resolve(process.argv[2]),'aptos'));
