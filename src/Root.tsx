import type {FC} from 'react';
import {Composition} from 'remotion';
import {AndronaAcademicMotion} from './compositions/AndronaAcademicMotion';
import {CharacterSheet} from './compositions/CharacterSheet';
import {AndronaAcademicMotion4K, MASTER_SCALE} from './compositions/MasterScale';
import {VIDEO} from './config/video';
import {TOTAL_DURATION} from './timeline/timeline';

const shared = {durationInFrames: TOTAL_DURATION, fps: VIDEO.fps} as const;

export const RemotionRoot: FC = () => (
	<>
		{/* Version réseaux sociaux 1080 × 1920. */}
		<Composition
			id="AndronaAcademicMotion"
			component={AndronaAcademicMotion}
			{...shared}
			width={VIDEO.width}
			height={VIDEO.height}
			defaultProps={{showSafeArea: false, audioMix: 'all' as const}}
		/>
		{/* Master 4K natif 2160 × 3840. */}
		<Composition
			id="AndronaAcademicMotion-4K"
			component={AndronaAcademicMotion4K}
			{...shared}
			width={VIDEO.width * MASTER_SCALE}
			height={VIDEO.height * MASTER_SCALE}
			defaultProps={{showSafeArea: false, audioMix: 'all' as const}}
		/>
		{/* Contrôle de la zone sûre Reels / TikTok (prévisualisation, ne pas diffuser). */}
		<Composition
			id="AndronaAcademicMotion-SafeArea"
			component={AndronaAcademicMotion}
			{...shared}
			width={VIDEO.width}
			height={VIDEO.height}
			defaultProps={{showSafeArea: true, audioMix: 'all' as const}}
		/>
		{/* Planche de contrôle des personnages (développement). */}
		<Composition id="Dev-CharacterSheet" component={CharacterSheet} durationInFrames={90} fps={VIDEO.fps} width={VIDEO.width} height={VIDEO.height} />
	</>
);
