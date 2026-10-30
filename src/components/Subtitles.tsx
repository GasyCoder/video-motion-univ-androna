import type {FC} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';
import {SUBTITLE_BAND, SAFE_RECT} from '../config/video';
import {SUBTITLES} from '../narration/subtitles';
import {FONT_STACK} from '../theme/fonts';
import {EASE} from '../theme/motion';

const HIGHLIGHT = '#FFC145';

/** Découpe « texte *mot clé* texte » en segments, le mot clé mis en valeur. */
const Rich: FC<{text: string}> = ({text}) => (
	<>
		{text.split('*').map((part, i) => (
			<span key={`${i}-${part}`} style={i % 2 === 1 ? {color: HIGHLIGHT} : undefined}>
				{part}
			</span>
		))}
	</>
);

/** Sous-titres français synchronisés sur la voix off (courts, une à deux lignes). */
export const Subtitles: FC = () => {
	const frame = useCurrentFrame();
	const chunk = SUBTITLES.find((c) => frame >= c.from && frame < c.to);
	if (!chunk) {
		return null;
	}
	const enter = interpolate(frame, [chunk.from, chunk.from + 6], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});
	const leave = interpolate(frame, [chunk.to - 4, chunk.to], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE_RECT.x,
				width: SUBTITLE_BAND.maxWidth,
				top: SUBTITLE_BAND.centerY,
				display: 'flex',
				justifyContent: 'center',
				translate: `0 calc(-50% + ${(1 - enter) * 14}px)`,
				opacity: enter * leave,
			}}
		>
			<div
				style={{
					maxWidth: SUBTITLE_BAND.maxWidth,
					padding: '14px 30px 16px',
					borderRadius: 26,
					background: 'rgba(8, 22, 52, 0.8)',
					boxShadow: '0 12px 30px -12px rgba(4, 16, 40, 0.5)',
					fontFamily: FONT_STACK.text,
					fontWeight: 600,
					fontSize: 44,
					lineHeight: 1.24,
					color: '#FFFFFF',
					textAlign: 'center',
					textWrap: 'balance',
				}}
			>
				<Rich text={chunk.text} />
			</div>
		</div>
	);
};
