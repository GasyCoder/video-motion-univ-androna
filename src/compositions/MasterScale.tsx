import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {VIDEO} from '../config/video';
import type {AndronaAcademicMotionProps} from './AndronaAcademicMotion';
import {AndronaAcademicMotion} from './AndronaAcademicMotion';

/** Facteur du master 4K (2160 × 3840) par rapport à la conception 1080 × 1920. */
export const MASTER_SCALE = 2;

/**
 * Master 4K natif : la composition (100 % vectorielle : SVG, texte, CSS) est
 * mise à l'échelle avant rastérisation par le navigateur. Chaque image est donc
 * calculée en 2160 × 3840, sans agrandissement d'une image 1080p.
 */
export const AndronaAcademicMotion4K: FC<AndronaAcademicMotionProps> = (props) => (
	<AbsoluteFill style={{backgroundColor: '#EEF2F8'}}>
		<div style={{position: 'absolute', left: 0, top: 0, width: VIDEO.width, height: VIDEO.height, transformOrigin: '0 0', scale: `${MASTER_SCALE}`}}>
			<AndronaAcademicMotion {...props} />
		</div>
	</AbsoluteFill>
);
