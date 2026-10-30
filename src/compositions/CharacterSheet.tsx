import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import type {HeldItem} from '../characters/Person';
import {Person} from '../characters/Person';
import type {CastName} from '../characters/looks';
import {CAST} from '../characters/looks';
import type {PoseName} from '../characters/rig';
import {POSES, walkPose} from '../characters/rig';
import {FONT_STACK} from '../theme/fonts';

/** Planche de contrôle du système de personnages (Studio uniquement, non diffusée). */
const ROWS: readonly (readonly {cast: CastName; pose: PoseName | 'walk'; held?: HeldItem; facing?: 1 | -1}[])[] = [
	[{cast: 'mainStudent', pose: 'stand'}, {cast: 'mainStudent', pose: 'think'}, {cast: 'mainStudent', pose: 'point'}, {cast: 'mainStudent', pose: 'walk'}],
	[{cast: 'mainStudent', pose: 'hold', held: 'book'}, {cast: 'mainStudentLab', pose: 'observe'}, {cast: 'mainStudentSite', pose: 'hold', held: 'tablet'}, {cast: 'graduate', pose: 'cheer'}],
	[{cast: 'teacher', pose: 'present'}, {cast: 'staff', pose: 'hold', held: 'folder'}, {cast: 'studentA', pose: 'raiseHand'}, {cast: 'studentB', pose: 'lookUp', facing: -1}],
	[{cast: 'studentC', pose: 'stand'}, {cast: 'studentD', pose: 'pointDown'}, {cast: 'mainStudent', pose: 'lookUp'}, {cast: 'teacher', pose: 'stand', facing: -1}],
];

export const CharacterSheet: FC = () => {
	const frame = useCurrentFrame();
	return (
		<AbsoluteFill style={{background: '#EEF2F8'}}>
			{ROWS.map((row, r) =>
				row.map((cell, c) => (
					<div key={`${r}-${c}`}>
						<Person
							look={CAST[cell.cast]}
							pose={cell.pose === 'walk' ? walkPose(frame / 30) : POSES[cell.pose]}
							frame={frame}
							seed={r * 4 + c}
							facing={cell.facing ?? 1}
							held={cell.held ?? 'none'}
							heldColor="#1E8BE3"
							x={140 + c * 266}
							y={430 + r * 470}
							scale={0.62}
						/>
						<div style={{position: 'absolute', left: 40 + c * 266, top: 446 + r * 470, width: 200, textAlign: 'center', font: `600 18px ${FONT_STACK.text}`, color: '#46556E'}}>
							{`${cell.cast} · ${cell.pose}`}
						</div>
					</div>
				)),
			)}
		</AbsoluteFill>
	);
};
