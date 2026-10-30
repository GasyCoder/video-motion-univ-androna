import type {FC} from 'react';
import {getLength} from '@remotion/paths';
import {ramp} from '../animation/progress';
import {VIDEO} from '../config/video';
import {NAVY} from '../theme/colors';
import {EASE} from '../theme/motion';

/** Durée d'un balayage (images). */
export const SWOOSH_DURATION = 20;

const PATH = `M -300 ${VIDEO.height * 0.86} C 240 ${VIDEO.height * 0.62}, 760 ${VIDEO.height * 0.6}, ${VIDEO.width + 320} ${VIDEO.height * 0.14}`;
const LENGTH = getLength(PATH);

/** Portion visible du tracé : la tête file devant, la queue la rattrape. */
const segment = (frame: number, from: number, delay: number) => {
	const head = ramp(frame, from + delay, SWOOSH_DURATION * 0.65, EASE.out);
	const tail = ramp(frame, from + delay + SWOOSH_DURATION * 0.3, SWOOSH_DURATION * 0.7, EASE.in);
	return {head, tail};
};

const Stroke: FC<{frame: number; from: number; delay: number; color: string; width: number}> = ({frame, from, delay, color, width}) => {
	const {head, tail} = segment(frame, from, delay);
	if (head <= 0 || tail >= 1) {
		return null;
	}
	// Un seul tiret visible, de la queue à la tête.
	return (
		<path
			d={PATH}
			fill="none"
			stroke={color}
			strokeWidth={width}
			strokeLinecap="round"
			strokeDasharray={`${LENGTH * (head - tail)} ${LENGTH * 2}`}
			strokeDashoffset={-LENGTH * tail}
		/>
	);
};

/**
 * Transition publicitaire : un ruban bleu et un trait blanc traversent l'écran
 * en diagonale pendant le changement de scène (sans le masquer complètement).
 */
export const Swoosh: FC<{frame: number; at: number}> = ({frame, at}) => {
	if (frame < at || frame > at + SWOOSH_DURATION + 8) {
		return null;
	}
	return (
		<svg width={VIDEO.width} height={VIDEO.height} style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
			<defs>
				<linearGradient id="swoosh-band" x1="0" y1="1" x2="1" y2="0">
					<stop offset="0" stopColor={NAVY.base} />
					<stop offset="1" stopColor={NAVY.highlight} />
				</linearGradient>
			</defs>
			<Stroke frame={frame} from={at} delay={0} color="url(#swoosh-band)" width={230} />
			<Stroke frame={frame} from={at} delay={3} color="#FFFFFF" width={30} />
			<Stroke frame={frame} from={at} delay={5} color="#FFC145" width={12} />
		</svg>
	);
};
