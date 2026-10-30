import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import type {Camera} from '../camera/camera';
import {FOCUS} from '../config/video';
import {ACADEMIC_STRUCTURE} from '../data/academicStructure';
import {PAPER, withAlpha} from '../theme/colors';
import {DOMAIN_THEMES} from '../theme/domainThemes';

interface BackgroundProps {
	readonly camera: Camera;
	/** Couleur du domaine actif (rgba). */
	readonly accent: string;
	/** 0 → 1 : halos des quatre domaines dans la vue d'ensemble. */
	readonly spectrum: number;
}

const DOT_SPACING = 46;
/** La trame de points bouge moins vite que le monde : sensation de profondeur. */
const PARALLAX = 0.55;

/** Halos de la vue d'ensemble, un par quadrant de la grille. */
const QUADRANTS = ['22% 30%', '80% 30%', '22% 74%', '80% 74%'];

export const Background: FC<BackgroundProps> = ({camera, accent, spectrum}) => {
	const depthZoom = Math.pow(camera.zoom, 0.6);
	const spacing = DOT_SPACING * depthZoom;
	const offsetX = FOCUS.x - camera.x * depthZoom * PARALLAX;
	const offsetY = FOCUS.y - camera.y * depthZoom * PARALLAX;

	return (
		<AbsoluteFill style={{background: `linear-gradient(180deg, ${PAPER.top} 0%, ${PAPER.bottom} 100%)`}}>
			<AbsoluteFill
				style={{
					background: [
						`radial-gradient(900px 760px at 82% 14%, ${accent}, transparent 70%)`,
						`radial-gradient(820px 820px at 8% 92%, ${accent}, transparent 72%)`,
					].join(', '),
					opacity: 0.2,
				}}
			/>
			<AbsoluteFill
				style={{
					opacity: spectrum * 0.9,
					background: ACADEMIC_STRUCTURE.map(
						(domain, i) =>
							`radial-gradient(620px 620px at ${QUADRANTS[i % QUADRANTS.length]}, ${withAlpha(DOMAIN_THEMES[domain.id].primary, 0.16)}, transparent 70%)`,
					).join(', '),
				}}
			/>
			<AbsoluteFill
				style={{
					backgroundImage: `radial-gradient(circle, ${PAPER.dot} ${1.6 * depthZoom}px, transparent ${2.2 * depthZoom}px)`,
					backgroundSize: `${spacing}px ${spacing}px`,
					backgroundPosition: `${offsetX}px ${offsetY}px`,
					maskImage: 'linear-gradient(180deg, transparent 0%, black 18%, black 78%, transparent 100%)',
				}}
			/>
			<AbsoluteFill
				style={{background: 'radial-gradient(120% 90% at 50% 45%, transparent 60%, rgba(12, 36, 84, 0.07) 100%)'}}
			/>
		</AbsoluteFill>
	);
};
