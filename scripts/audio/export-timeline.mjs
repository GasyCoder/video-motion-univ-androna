// Calcule la timeline (TypeScript) et l'écrit dans .cache/timeline.json.
import {build} from 'esbuild';
import {mkdirSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outfile = join(root, '.cache', 'timeline-entry.mjs');
mkdirSync(dirname(outfile), {recursive: true});
await build({entryPoints: [join(root, 'scripts', 'audio', 'timeline-entry.ts')], bundle: true, platform: 'node', format: 'esm', outfile, logLevel: 'error'});
const json = execFileSync(process.execPath, [outfile], {encoding: 'utf8'});
writeFileSync(join(root, '.cache', 'timeline.json'), json);
const t = JSON.parse(json);
console.log(`timeline : ${t.total} images (${(t.total / t.fps).toFixed(2)} s) → .cache/timeline.json`);
