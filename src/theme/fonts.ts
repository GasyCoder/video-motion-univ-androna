import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

/**
 * Polices variables embarquées localement (public/fonts, licence OFL) :
 * le rendu ne dépend d'aucun service externe.
 * - Montserrat : acronymes et titres (forts, géométriques).
 * - Inter : descriptions (lisibilité maximale sur mobile).
 */
export const FONT_FAMILY = {
	display: 'Montserrat',
	text: 'Inter',
} as const;

export const FONT_STACK = {
	display: `${FONT_FAMILY.display}, ${FONT_FAMILY.text}, system-ui, sans-serif`,
	text: `${FONT_FAMILY.text}, system-ui, sans-serif`,
} as const;

const LATIN =
	'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
	'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';

const FACES = [
	{family: FONT_FAMILY.display, file: 'montserrat-latin-wght-normal.woff2', unicodeRange: LATIN},
	{family: FONT_FAMILY.display, file: 'montserrat-latin-ext-wght-normal.woff2', unicodeRange: LATIN_EXT},
	{family: FONT_FAMILY.text, file: 'inter-latin-wght-normal.woff2', unicodeRange: LATIN},
	{family: FONT_FAMILY.text, file: 'inter-latin-ext-wght-normal.woff2', unicodeRange: LATIN_EXT},
] as const;

/** Résolue quand toutes les polices sont prêtes (mesure du texte possible). */
export const fontsReady: Promise<void> = Promise.all(
	FACES.map((face) =>
		loadFont({
			family: face.family,
			url: staticFile(`fonts/${face.file}`),
			weight: '100 900',
			unicodeRange: face.unicodeRange,
			format: 'woff2',
		}),
	),
).then(() => undefined);
