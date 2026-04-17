import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDevPkcDataPath } from '../electron/pkc-paths.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(dirname, '..');
const dataPath = getDevPkcDataPath(projectRoot);

console.log(`Removing local PKC data path: ${dataPath}`);
fs.rmSync(dataPath, { recursive: true, force: true });
