// Copie les polices variables (licence OFL) depuis node_modules vers public/fonts
// pour que le rendu fonctionne hors ligne, sans dépendre de Google Fonts.
import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'fonts');
mkdirSync(outDir, {recursive: true});

const files = [
	['@fontsource-variable/inter', 'inter-latin-wght-normal.woff2'],
	['@fontsource-variable/inter', 'inter-latin-ext-wght-normal.woff2'],
	['@fontsource-variable/montserrat', 'montserrat-latin-wght-normal.woff2'],
	['@fontsource-variable/montserrat', 'montserrat-latin-ext-wght-normal.woff2'],
];

for (const [pkg, file] of files) {
	const src = join(root, 'node_modules', pkg, 'files', file);
	if (!existsSync(src)) {
		console.warn(`[fonts] introuvable : ${src}`);
		continue;
	}
	copyFileSync(src, join(outDir, file));
}

console.log(`[fonts] polices copiées dans ${outDir}`);
