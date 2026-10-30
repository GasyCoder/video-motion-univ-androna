// Rend une série d'images clés (planche de contrôle) en un seul bundle.
// Usage : node scripts/render-stills.mjs [--safe] [--comp=ID] [--scale=0.5] [frame frame ...]
// Sans frame : une image par moment clé de la vidéo. Sortie : out/stills/
import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const safe = args.includes('--safe');
const compArg = args.find((a) => a.startsWith('--comp='))?.slice(7);
const scaleArg = Number(args.find((a) => a.startsWith('--scale='))?.slice(8) ?? 0.5);
const frames = args.filter((a) => /^\d+$/.test(a)).map(Number);
const DEFAULT_FRAMES = [40, 75, 150, 190, 240, 300, 360, 420, 500, 560, 650, 690, 760, 840, 900, 950, 1000, 1040, 1070, 1140];

const outDir = join(root, 'out', 'stills');
mkdirSync(outDir, {recursive: true});

const serveUrl = await bundle({entryPoint: join(root, 'src', 'index.ts')});
const id = compArg ?? (safe ? 'AndronaAcademicMotion-SafeArea' : 'AndronaAcademicMotion');
const browser = await openBrowser('chrome');
const composition = await selectComposition({serveUrl, id, puppeteerInstance: browser});

for (const frame of frames.length > 0 ? frames : DEFAULT_FRAMES) {
	const prefix = compArg ? `${compArg}-` : safe ? 'safe-' : '';
	const output = join(outDir, `${prefix}${String(frame).padStart(4, '0')}.png`);
	await renderStill({serveUrl, composition, frame, output, puppeteerInstance: browser, scale: scaleArg});
	console.log(`image ${frame} → ${output}`);
}

await browser.close({silent: true});
