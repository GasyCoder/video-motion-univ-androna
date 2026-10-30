import type {FC, ReactNode} from 'react';
import {interpolate} from 'remotion';
import {ramp, springAt} from '../animation/progress';
import type {HeldItem} from '../characters/Person';
import {PersonG} from '../characters/Person';
import type {Look} from '../characters/looks';
import {CAST} from '../characters/looks';
import type {Pose, PoseKey} from '../characters/rig';
import {POSES, poseAt} from '../characters/rig';
import type {DomainId} from '../data/academicStructure';
import {TREE, VIGNETTE_HEIGHT} from '../layout/metrics';
import type {DomainTheme} from '../theme/domainThemes';
import {EASE, SPRINGS} from '../theme/motion';
import {BarChart, Blueprint, BookStack, Flask, Globe, Institution, MapSheet, Microscope, Scales, Seedling, Strata, Theodolite} from './objects';

const STUDENT = {x: 712, feetY: 176, scale: 0.62} as const;
const GROUND = -6;

interface Scenario {
	readonly look: Look;
	readonly held: HeldItem;
	/** Poses successives, en images après l'apparition de la vignette. */
	readonly poses: readonly {at: number; pose: Pose}[];
	readonly objects: (theme: DomainTheme) => readonly ReactNode[];
}

/** Mise en situation de l'étudiante dans chaque domaine. */
const SCENARIOS: Record<DomainId, Scenario> = {
	alsh: {
		look: CAST.mainStudent,
		held: 'book',
		poses: [
			{at: 0, pose: POSES.hold},
			{at: 46, pose: {...POSES.pointDown, lookY: 0.2}},
		],
		objects: (t) => [
			<Globe key="globe" x={150} y={GROUND} s={0.95} color={t.primary} />,
			<BookStack key="books" x={330} y={GROUND} s={0.95} color={t.deep} accent="#F0A01A" />,
			<MapSheet key="map" x={505} y={GROUND} s={0.85} color={t.primary} accent="#F0A01A" />,
		],
	},
	st: {
		look: CAST.mainStudentLab,
		held: 'none',
		poses: [
			{at: 0, pose: POSES.observe},
			{at: 50, pose: {...POSES.stand, smile: 0.7, lookX: -0.6}},
		],
		objects: (t) => [
			<Seedling key="seed" x={150} y={GROUND} s={0.9} color={t.primary} />,
			<Flask key="flask" x={320} y={GROUND} s={0.95} color={t.primary} />,
			<Microscope key="micro" x={540} y={GROUND} s={0.95} color={t.deep} />,
		],
	},
	ss: {
		look: CAST.mainStudent,
		held: 'folder',
		poses: [
			{at: 0, pose: POSES.hold},
			{at: 44, pose: {...POSES.point, frontArm: {shoulder: 96, elbow: 10}}},
		],
		objects: (t) => [
			<Institution key="inst" x={170} y={GROUND} s={0.85} color={t.primary} />,
			<Scales key="scales" x={370} y={GROUND} s={0.85} color={t.deep} />,
			<BarChart key="chart" x={540} y={GROUND} s={0.88} color={t.primary} accent="#1E8BE3" />,
		],
	},
	si: {
		look: CAST.mainStudentSite,
		held: 'tablet',
		poses: [
			{at: 0, pose: POSES.hold},
			{at: 44, pose: POSES.pointDown},
		],
		objects: (t) => [
			<Strata key="strata" x={165} y={GROUND} s={0.85} color={t.primary} />,
			<Theodolite key="theo" x={360} y={GROUND} s={0.92} color={t.deep} accent="#F2B233" />,
			<Blueprint key="plan" x={545} y={GROUND} s={0.82} color={t.primary} />,
		],
	},
};

interface DomainVignetteProps {
	readonly domain: DomainId;
	readonly theme: DomainTheme;
	/** Image absolue de la timeline. */
	readonly frame: number;
	/** Apparition (la carte domaine vient de se poser). */
	readonly startAt: number;
	readonly lod: number;
}

/**
 * Illustration de domaine posée sur la carte : objets du domaine à gauche,
 * étudiante principale qui surgit derrière la carte à droite.
 */
export const DomainVignette: FC<DomainVignetteProps> = ({domain, theme, frame, startAt, lod}) => {
	const fade = 1 - interpolate(lod, [0, 0.4], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	if (frame < startAt || fade <= 0) {
		return null;
	}
	const scenario = SCENARIOS[domain];
	const rise = springAt(frame, startAt + 4, SPRINGS.card);
	const backdrop = ramp(frame, startAt, 18, EASE.out);
	const keys: PoseKey[] = scenario.poses.map((p) => ({at: startAt + p.at, pose: p.pose, blend: 14}));
	const t = frame - startAt;

	return (
		<svg
			width={TREE.width}
			height={VIGNETTE_HEIGHT + 240}
			viewBox={`0 ${-VIGNETTE_HEIGHT} ${TREE.width} ${VIGNETTE_HEIGHT + 240}`}
			style={{position: 'absolute', left: 0, top: -VIGNETTE_HEIGHT, overflow: 'visible', opacity: fade}}
		>
			<circle cx={STUDENT.x} cy={-96} r={150 * backdrop} fill={theme.soft} opacity={0.7} />
			<circle cx={STUDENT.x - 120} cy={-210} r={16 * backdrop} fill={theme.primary} opacity={0.25} />
			<circle cx={STUDENT.x + 118} cy={-30} r={10 * backdrop} fill={theme.primary} opacity={0.3} />

			{scenario.objects(theme).map((node, i) => {
				const pop = springAt(frame, startAt + 6 + i * 5, SPRINGS.pop);
				const float = Math.sin((t + i * 23) / 22) * 3;
				return (
					<g key={i} transform={`translate(0 ${float}) `} opacity={Math.min(1, Math.max(0, pop) * 1.4)}>
						<g style={{transformBox: 'fill-box', transformOrigin: '50% 100%', scale: `${Math.max(0, pop)}`}}>{node}</g>
					</g>
				);
			})}

			<defs>
				{/* L'étudiante n'existe qu'au-dessus de la carte : rien ne dépasse dessous pendant qu'elle surgit. */}
				<clipPath id={`vignette-clip-${domain}`}>
					<rect x={0} y={-VIGNETTE_HEIGHT - 200} width={TREE.width} height={VIGNETTE_HEIGHT + 214} />
				</clipPath>
			</defs>
			<g clipPath={`url(#vignette-clip-${domain})`}>
			<g transform={`translate(${STUDENT.x} ${STUDENT.feetY + (1 - rise) * 260}) scale(${STUDENT.scale})`}>
				<PersonG
					look={scenario.look}
					pose={poseAt(frame, keys)}
					frame={frame}
					seed={domain.length * 7}
					facing={-1}
					held={scenario.held}
					heldColor={theme.primary}
					shadow={false}
				/>
			</g>
			</g>
		</svg>
	);
};
