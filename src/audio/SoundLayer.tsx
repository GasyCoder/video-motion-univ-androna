import {Audio} from '@remotion/media';
import type {FC} from 'react';
import {Sequence, interpolate, staticFile} from 'remotion';
import {NARRATION, SEGMENT_IDS, speechEnd} from '../narration/narration';
import {TOTAL_DURATION, VOICE_PLACEMENT} from '../timeline/timeline';
import type {AudioMix} from './audioConfig';
import {MUSIC, MUSIC_MIX, SFX, VOICE_VOLUME} from './audioConfig';
import {SOUND_CUES} from './soundCues';

const SFX_LENGTH = 75;
const dbToGain = (db: number) => 10 ** (db / 20);

/** Présence de la voix (0 → 1) à une image donnée, avec attaque et relâchement adoucis. */
export const voiceActivity = (frame: number): number => {
	let activity = 0;
	for (const id of SEGMENT_IDS) {
		const start = VOICE_PLACEMENT[id];
		const end = start + speechEnd(id);
		const a = interpolate(frame, [start - MUSIC_MIX.duckAttack, start, end, end + MUSIC_MIX.duckRelease], [0, 1, 1, 0], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
		});
		activity = Math.max(activity, a);
	}
	// Courbe en S : pas de variation de volume brusque.
	return activity * activity * (3 - 2 * activity);
};

/** Volume de la musique : lit, ducking sous la voix, fondus d'entrée et de sortie. */
export const musicVolume = (frame: number): number => {
	const fades = interpolate(frame, [0, MUSIC_MIX.fadeIn, TOTAL_DURATION - MUSIC_MIX.fadeOut, TOTAL_DURATION], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return MUSIC.volume * dbToGain(MUSIC_MIX.bedDb + MUSIC_MIX.duckDb * voiceActivity(frame)) * fades;
};

/** Voix off + musique + effets sonores (`@remotion/media`). */
export const SoundLayer: FC<{mix: AudioMix}> = ({mix}) => (
	<>
		{mix === 'all' || mix === 'voice'
			? SEGMENT_IDS.map((id) => (
					<Sequence key={id} name={`Voix · ${id}`} from={VOICE_PLACEMENT[id]} durationInFrames={NARRATION[id].frames + 2} layout="none">
						<Audio src={staticFile(NARRATION[id].file)} volume={VOICE_VOLUME} />
					</Sequence>
				))
			: null}
		{mix === 'all' || mix === 'music' ? (
			<Sequence name="Musique" durationInFrames={TOTAL_DURATION} layout="none">
				<Audio src={staticFile(MUSIC.src)} volume={musicVolume} />
			</Sequence>
		) : null}
		{mix === 'all' || mix === 'sfx'
			? SOUND_CUES.map((cue) => (
					<Sequence key={`${cue.kind}-${cue.frame}-${cue.label}`} name={`♪ ${cue.label}`} from={cue.frame} durationInFrames={SFX_LENGTH} layout="none">
						<Audio src={staticFile(SFX[cue.kind].src)} volume={SFX[cue.kind].volume * cue.gain} />
					</Sequence>
				))
			: null}
	</>
);
