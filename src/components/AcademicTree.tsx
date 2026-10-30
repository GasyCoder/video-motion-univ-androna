import type {FC} from 'react';
import {interpolate} from 'remotion';
import {ramp, springAt} from '../animation/progress';
import type {Point} from '../layout/geometry';
import {TREE} from '../layout/metrics';
import type {TreeLayout} from '../layout/treeLayout';
import {DOMAIN_THEMES} from '../theme/domainThemes';
import {EASE, SPRINGS} from '../theme/motion';
import {BUILD_BEATS} from '../timeline/choreography';
import {AnimatedConnector, ConnectorNode} from './AnimatedConnector';
import {DomainVignette} from '../illustrations/DomainVignette';
import {DomainCard} from './DomainCard';
import {MentionCard} from './MentionCard';
import {ProgramCard} from './ProgramCard';

interface AcademicTreeProps {
	readonly tree: TreeLayout;
	readonly origin: Point;
	/** Image absolue de la timeline (les plans de construction sont en temps absolu). */
	readonly frame: number;
	readonly lod: number;
	readonly highlight: number;
}

/** Pastille d'arrivée : apparaît quand le tracé atteint la carte. */
const nodeProgress = (draw: number): number =>
	interpolate(draw, [0.82, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: EASE.out});

/**
 * Arbre animé d'un domaine, généré depuis les données :
 * domaine → tronc → mentions → branches → parcours.
 */
export const AcademicTree: FC<AcademicTreeProps> = ({tree, origin, frame, lod, highlight}) => {
	const {plan} = tree.measured;
	const theme = DOMAIN_THEMES[plan.domain.id];

	const mentions = tree.mentions.map((node) => {
		const mp = node.measured.plan;
		return {
			node,
			draw: ramp(frame, mp.branchAt, mp.branchDuration, EASE.draw),
			reveal: springAt(frame, mp.revealAt, SPRINGS.reveal),
			programs: node.programs.map((pn) => ({
				node: pn,
				draw: ramp(frame, pn.measured.plan.branchAt, BUILD_BEATS.rowBranchDraw, EASE.draw),
				reveal: springAt(frame, pn.measured.plan.revealAt, SPRINGS.reveal),
			})),
		};
	});

	const svgProps = {
		width: TREE.width,
		height: tree.height,
		style: {position: 'absolute', left: 0, top: 0, overflow: 'visible'},
	} as const;

	return (
		<div style={{position: 'absolute', left: origin.x, top: origin.y, width: TREE.width, height: tree.height}}>
			<svg {...svgProps}>
				{mentions.map((m) => (
					<AnimatedConnector key={`m-${m.node.measured.plan.mention.code}`} path={m.node.connector} progress={m.draw} color={theme.line} />
				))}
				{mentions.flatMap((m) =>
					m.programs.map((p) => (
						<AnimatedConnector
							key={`p-${p.node.measured.plan.program.code}`}
							path={p.node.connector}
							progress={p.draw * p.node.expansion}
							color={theme.line}
							width={TREE.strokeWidth - 1}
						/>
					)),
				)}
			</svg>

			{mentions.flatMap((m) =>
				m.programs.map((p) => (
					<ProgramCard
						key={`p-${p.node.measured.plan.program.code}`}
						program={p.node.measured.plan.program}
						theme={theme}
						rect={p.node.rect}
						codeColumn={tree.measured.codeColumn}
						expansion={p.node.expansion}
						reveal={p.reveal}
						lod={lod}
					/>
				)),
			)}
			{mentions.map((m) => (
				<MentionCard
					key={`m-${m.node.measured.plan.mention.code}`}
					mention={m.node.measured.plan.mention}
					inline={m.node.measured.inline}
					theme={theme}
					rect={m.node.rect}
					reveal={m.reveal}
					lod={lod}
				/>
			))}

			<svg {...svgProps}>
				{mentions.map((m) => (
					<ConnectorNode
						key={`m-${m.node.measured.plan.mention.code}`}
						x={m.node.anchor.x}
						y={m.node.anchor.y}
						progress={nodeProgress(m.draw)}
						color={theme.primary}
						radius={11}
					/>
				))}
				{mentions.flatMap((m) =>
					m.programs.map((p) => (
						<ConnectorNode
							key={`p-${p.node.measured.plan.program.code}`}
							x={p.node.anchor.x}
							y={p.node.anchor.y}
							progress={nodeProgress(p.draw) * p.node.expansion}
							color={theme.primary}
							radius={8}
						/>
					)),
				)}
			</svg>

			<DomainVignette domain={plan.domain.id} theme={theme} frame={frame} startAt={plan.vignetteAt} lod={lod} />
			<DomainCard
				domain={plan.domain}
				theme={theme}
				index={plan.index}
				height={tree.card.height}
				frame={frame}
				startAt={plan.cardAt}
				entrance={plan.choreography.cardFrom}
				highlight={highlight}
			/>
		</div>
	);
};
