import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./src/teleprompter.js', import.meta.url), 'utf8');
const encoded = encodeURIComponent(source).replaceAll("'", "%27");
process.stdout.write(`javascript:void ${encoded}\n`);
