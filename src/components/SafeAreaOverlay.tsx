import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {SAFE_AREA, SAFE_RECT, VIDEO} from '../config/video';

const ZONE = 'rgba(255, 40, 80, 0.16)';

/** Visualisation des zones occupées par les interfaces des réseaux sociaux (prévisualisation uniquement). */
export const SafeAreaOverlay: FC = () => (
	<AbsoluteFill style={{pointerEvents: 'none'}}>
		<div style={{position: 'absolute', left: 0, top: 0, width: VIDEO.width, height: SAFE_AREA.top, background: ZONE}} />
		<div style={{position: 'absolute', left: 0, bottom: 0, width: VIDEO.width, height: SAFE_AREA.bottom, background: ZONE}} />
		<div style={{position: 'absolute', left: 0, top: SAFE_AREA.top, width: SAFE_AREA.left, height: SAFE_RECT.height, background: ZONE}} />
		<div style={{position: 'absolute', right: 0, top: SAFE_AREA.top, width: SAFE_AREA.right, height: SAFE_RECT.height, background: ZONE}} />
		<div
			style={{
				position: 'absolute',
				left: SAFE_RECT.x,
				top: SAFE_RECT.y,
				width: SAFE_RECT.width,
				height: SAFE_RECT.height,
				outline: '3px dashed rgba(255, 40, 80, 0.7)',
			}}
		/>
	</AbsoluteFill>
);
