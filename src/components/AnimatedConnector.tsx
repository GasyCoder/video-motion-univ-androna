import {evolvePath} from '@remotion/paths';
import type {FC} from 'react';
import {clamp} from '../layout/geometry';
import {TREE} from '../layout/metrics';

interface AnimatedConnectorProps {
	readonly path: string;
	/** 0 → 1 : portion tracée (stroke-dashoffset). */
	readonly progress: number;
	readonly color: string;
	readonly width?: number;
}

/** Branche SVG qui se dessine progressivement. */
export const AnimatedConnector: FC<AnimatedConnectorProps> = ({path, progress, color, width = TREE.strokeWidth}) => {
	if (progress <= 0) {
		return null;
	}
	const {strokeDasharray, strokeDashoffset} = evolvePath(clamp(progress), path);
	return (
		<path
			d={path}
			fill="none"
			stroke={color}
			strokeWidth={width}
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeDasharray={strokeDasharray}
			strokeDashoffset={strokeDashoffset}
		/>
	);
};

interface ConnectorNodeProps {
	readonly x: number;
	readonly y: number;
	readonly progress: number;
	readonly color: string;
	readonly radius?: number;
}

/** Pastille à l'arrivée d'une branche, sur le bord de la carte. */
export const ConnectorNode: FC<ConnectorNodeProps> = ({x, y, progress, color, radius = 10}) => {
	if (progress <= 0) {
		return null;
	}
	return (
		<circle
			cx={x}
			cy={y}
			r={radius * Math.max(0, progress)}
			fill="#FFFFFF"
			stroke={color}
			strokeWidth={radius * 0.55}
		/>
	);
};
