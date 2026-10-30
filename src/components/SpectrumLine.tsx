import type {CSSProperties, FC} from 'react';
import {ACADEMIC_STRUCTURE} from '../data/academicStructure';
import {DOMAIN_THEMES} from '../theme/domainThemes';

interface SpectrumLineProps {
	readonly width: number;
	readonly height?: number;
	/** 0 → 1 : la ligne se déploie depuis son centre. */
	readonly progress: number;
	readonly style?: CSSProperties;
}

/** Signature graphique : les couleurs des domaines, dans l'ordre de l'organigramme. */
export const SpectrumLine: FC<SpectrumLineProps> = ({width, height = 6, progress, style}) => (
	<div
		style={{
			width,
			height,
			display: 'flex',
			gap: height * 1.4,
			transform: `scaleX(${Math.max(0, progress)})`,
			opacity: Math.min(1, progress * 3),
			...style,
		}}
	>
		{ACADEMIC_STRUCTURE.map((domain) => (
			<div key={domain.id} style={{flex: 1, borderRadius: height, background: DOMAIN_THEMES[domain.id].primary}} />
		))}
	</div>
);
