import type {FC} from 'react';
import {ramp, springAt} from '../animation/progress';
import {evolvePath} from '@remotion/paths';
import {SAFE_RECT} from '../config/video';
import {EASE, SPRINGS} from '../theme/motion';
import {FONT_STACK} from '../theme/fonts';

export interface HeadlineWord {
	readonly text: string;
	readonly color: string;
	/** Trait manuscrit tracé sous ce mot. */
	readonly underline?: string;
}

interface KineticHeadlineProps {
	readonly frame: number;
	readonly lines: readonly (readonly HeadlineWord[])[];
	readonly at: number;
	readonly exitAt: number;
	readonly top: number;
	readonly fontSize: number;
}

const UNDERLINE = 'M 4 22 C 120 6 300 2 470 14';

/**
 * Titre publicitaire : les lettres rebondissent l'une après l'autre (ressort),
 * un trait manuscrit souligne le mot clé, puis le bloc s'envole vers le haut.
 */
export const KineticHeadline: FC<KineticHeadlineProps> = ({frame, lines, at, exitAt, top, fontSize}) => {
	const exit = ramp(frame, exitAt, 10, EASE.in);
	if (frame < at || exit >= 1) {
		return null;
	}
	let letterIndex = 0;
	return (
		<div
			style={{
				position: 'absolute',
				left: SAFE_RECT.x,
				width: SAFE_RECT.width,
				top,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				gap: 0,
				fontFamily: FONT_STACK.display,
				fontWeight: 900,
				fontSize,
				lineHeight: 1.04,
				letterSpacing: '-0.02em',
				opacity: 1 - exit,
				translate: `0 ${-70 * exit}px`,
				filter: exit > 0.01 ? `blur(${exit * 8}px)` : undefined,
			}}
		>
			{lines.map((line, li) => (
				<div key={li} style={{display: 'flex', gap: fontSize * 0.26, whiteSpace: 'nowrap'}}>
					{line.map((word) => {
						const wordStart = letterIndex;
						letterIndex += word.text.length + 2;
						const underline = word.underline ? ramp(frame, at + wordStart + 10, 14, EASE.draw) : 0;
						return (
							<span key={word.text} style={{position: 'relative', display: 'inline-flex', color: word.color}}>
								{[...word.text].map((char, ci) => {
									const p = springAt(frame, at + wordStart + ci * 0.9, SPRINGS.pop);
									return (
										<span
											key={ci}
											style={{
												display: 'inline-block',
												opacity: Math.min(1, Math.max(0, p) * 2),
												translate: `0 ${(1 - p) * fontSize * 0.7}px`,
												rotate: `${(1 - p) * -10}deg`,
												scale: `${0.6 + 0.4 * p}`,
											}}
										>
											{char === ' ' ? ' ' : char}
										</span>
									);
								})}
								{word.underline && underline > 0 ? (
									<svg
										viewBox="0 0 474 30"
										preserveAspectRatio="none"
										style={{position: 'absolute', left: '-2%', width: '104%', bottom: -fontSize * 0.2, height: fontSize * 0.3, overflow: 'visible'}}
									>
										<path
											d={UNDERLINE}
											fill="none"
											stroke={word.underline}
											strokeWidth={10}
											strokeLinecap="round"
											{...evolvePath(underline, UNDERLINE)}
										/>
									</svg>
								) : null}
							</span>
						);
					})}
				</div>
			))}
		</div>
	);
};
