import type {FC} from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {accentColorAt, spectrumGlowAt, worldStateAt} from '../animation/worldState';
import type {AudioMix} from '../audio/audioConfig';
import {SoundLayer} from '../audio/SoundLayer';
import {rectToScreen} from '../camera/camera';
import {cameraAt} from '../camera/cameraPath';
import {Background} from '../components/Background';
import {FontGate} from '../components/FontGate';
import {SafeAreaOverlay} from '../components/SafeAreaOverlay';
import {Subtitles} from '../components/Subtitles';
import {Swoosh} from '../components/Swoosh';
import {getMeasuredStructure} from '../layout/measure';
import {layoutWorld} from '../layout/worldLayout';
import {FinalCrowd} from '../scenes/FinalCrowd';
import {FuturesScene} from '../scenes/FuturesScene';
import {OpeningScene} from '../scenes/OpeningScene';
import {OutroScene} from '../scenes/OutroScene';
import {TogetherScene} from '../scenes/TogetherScene';
import {WorldScene} from '../scenes/WorldScene';
import {DOMAIN_PLANS, FINAL, FUTURES, GATEWAY, OPENING_END, OUTRO, TOGETHER, WORLD_WINDOW} from '../timeline/timeline';

/** Balayages publicitaires aux changements de scène. */
const SWOOSHES = [GATEWAY.exitAt - 4, FUTURES.from - 6, TOGETHER.from - 6, FINAL.from - 4] as const;

export interface AndronaAcademicMotionProps extends Record<string, unknown> {
	/** Affiche les zones réservées aux interfaces des réseaux sociaux. */
	readonly showSafeArea: boolean;
	/** Couches audio audibles (contrôle du mixage). */
	readonly audioMix: AudioMix;
}

const Main: FC<AndronaAcademicMotionProps> = ({showSafeArea, audioMix}) => {
	const frame = useCurrentFrame();
	const measured = getMeasuredStructure();
	const state = worldStateAt(frame);
	const layout = layoutWorld(measured, state);
	const camera = cameraAt(frame, layout);

	return (
		<AbsoluteFill style={{backgroundColor: '#EEF2F8'}}>
			<Background camera={camera} accent={accentColorAt(frame)} spectrum={spectrumGlowAt(frame)} />

			<Sequence name="03-06 · 09 · Monde académique" from={WORLD_WINDOW.from} durationInFrames={WORLD_WINDOW.duration}>
				{/* Le monde suit la timeline absolue : on lui transmet l'image globale. */}
				<WorldScene frame={frame} layout={layout} camera={camera} lod={state.lod} />
			</Sequence>
			{DOMAIN_PLANS.map((plan) => (
				<Sequence
					key={plan.domain.id}
					name={`${String(plan.index + 3).padStart(2, '0')} · ${plan.domain.code}`}
					from={plan.from}
					durationInFrames={plan.duration}
					layout="none"
				>
					{null}
				</Sequence>
			))}

			<Sequence name="01-02 · Accroche et université" durationInFrames={OPENING_END}>
				<OpeningScene />
			</Sequence>
			<Sequence name="07 · Avenir professionnel" from={FUTURES.from} durationInFrames={FUTURES.end - FUTURES.from + 10}>
				<FuturesScene frame={frame} />
			</Sequence>
			<Sequence name="08 · Enseignants et équipes" from={TOGETHER.from} durationInFrames={TOGETHER.end - TOGETHER.from + 10}>
				<TogetherScene frame={frame} />
			</Sequence>
			<Sequence name="09 · Révélation et étudiants" from={FINAL.from} durationInFrames={OUTRO.from + 20 - FINAL.from}>
				<FinalCrowd frame={frame} />
			</Sequence>
			<Sequence name="10 · Carte de fin" from={OUTRO.from} durationInFrames={OUTRO.duration}>
				<OutroScene rootScreen={rectToScreen(camera, layout.root)} zoom={camera.zoom} />
			</Sequence>

			{SWOOSHES.map((at) => (
				<Swoosh key={at} frame={frame} at={at} />
			))}
			<Subtitles />
			<SoundLayer mix={audioMix} />
			{showSafeArea ? <SafeAreaOverlay /> : null}
		</AbsoluteFill>
	);
};

/** Vidéo d'orientation : Université d'Androna. */
export const AndronaAcademicMotion: FC<AndronaAcademicMotionProps> = (props) => (
	<FontGate>
		<Main {...props} />
	</FontGate>
);
