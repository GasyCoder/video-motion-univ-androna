import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {ramp, springAt} from '../animation/progress';
import {domainHighlight, programExpansion} from '../animation/worldState';
import {AcademicTree} from '../components/AcademicTree';
import {AnimatedConnector, ConnectorNode} from '../components/AnimatedConnector';
import {CameraContainer} from '../components/CameraContainer';
import {InstitutionBanner} from '../components/InstitutionBanner';
import type {Camera} from '../camera/camera';
import {layoutTree} from '../layout/treeLayout';
import type {WorldLayout} from '../layout/worldLayout';
import {WORLD} from '../layout/worldLayout';
import {LOCKUP} from '../theme/lockup';
import {EASE, SPRINGS} from '../theme/motion';
import {DOMAIN_THEMES} from '../theme/domainThemes';
import {FINAL, FUTURES, OUTRO, WORLD_WINDOW} from '../timeline/timeline';

const SPINE_COLOR = '#9FB4D8';

interface WorldSceneProps {
	/** Image absolue de la timeline. */
	readonly frame: number;
	readonly layout: WorldLayout;
	readonly camera: Camera;
	readonly lod: number;
}

/**
 * Scènes 03 à 07 : le monde académique filmé par la caméra.
 * Chaque domaine se construit à son tour (plans de la timeline), puis la
 * caméra recule pour révéler la structure complète reliée à l'université.
 */
export const WorldScene: FC<WorldSceneProps> = ({frame, layout, camera, lod}) => {
	const fadeIn = ramp(frame, WORLD_WINDOW.from, 14, EASE.out);
	const fadeOut = ramp(frame, OUTRO.from, OUTRO.worldFadeDuration, EASE.standard);
	// Le monde s'efface pendant les scènes « avenir » et « ensemble », puis revient pour la révélation.
	const away = ramp(frame, FUTURES.from, 12, EASE.standard) * (1 - ramp(frame, FINAL.from - 4, 18, EASE.standard));
	if (away >= 1) {
		return null;
	}
	const rootAt = FINAL.from + FINAL.rootAt;
	const rootReveal = springAt(frame, rootAt, SPRINGS.card);
	const spineDraw = ramp(frame, FINAL.from + FINAL.spineAt, FINAL.spineDuration, EASE.draw);
	// À partir de l'outro, le bandeau racine est repris par l'écran de fin (même géométrie).
	const showRoot = frame < OUTRO.from && rootReveal > 0;
	const root = layout.root;

	return (
		<AbsoluteFill style={{opacity: fadeIn * (1 - fadeOut) * (1 - away)}}>
			<CameraContainer camera={camera}>
				{spineDraw > 0 ? (
					<svg width={layout.grid.width} height={layout.grid.height} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
						{layout.spine.map((branch) => (
							<AnimatedConnector key={branch.slot.measured.plan.domain.id} path={branch.path} progress={spineDraw} color={SPINE_COLOR} width={7} />
						))}
						{layout.spine.map((branch) => (
							<ConnectorNode
								key={`n-${branch.slot.measured.plan.domain.id}`}
								x={branch.target.x}
								y={branch.target.y}
								progress={ramp(spineDraw, 0.85, 0.15, EASE.out)}
								color={DOMAIN_THEMES[branch.slot.measured.plan.domain.id].primary}
								radius={14}
							/>
						))}
					</svg>
				) : null}

				{layout.slots.map((slot) => {
					const {plan} = slot.measured;
					if (frame < plan.from) {
						return null;
					}
					return (
						<AcademicTree
							key={plan.domain.id}
							tree={layoutTree(slot.measured, lod, (p) => programExpansion(p, frame))}
							origin={slot.origin}
							frame={frame}
							lod={lod}
							highlight={domainHighlight(plan.index, frame)}
						/>
					);
				})}

				{showRoot ? (
					<div
						style={{
							position: 'absolute',
							left: 0,
							top: 0,
							opacity: Math.min(1, rootReveal * 1.6),
							transform: `translateY(${(1 - rootReveal) * -220}px)`,
						}}
					>
						<InstitutionBanner
							rect={root}
							radius={WORLD.root.radius}
							scale={1}
							metrics={LOCKUP.root}
							contentCenter={{x: root.x + root.width / 2, y: root.y + root.height / 2}}
							lineProgress={[springAt(frame, rootAt + 6, SPRINGS.text), springAt(frame, rootAt + 11, SPRINGS.text)]}
							subtitleProgress={springAt(frame, rootAt + 16, SPRINGS.text)}
							accentProgress={springAt(frame, rootAt + 20, SPRINGS.text)}
							iconOpacity={ramp(frame, rootAt + 10, 16, EASE.out)}
						/>
					</div>
				) : null}
			</CameraContainer>
		</AbsoluteFill>
	);
};
