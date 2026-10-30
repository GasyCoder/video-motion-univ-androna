import type {CSSProperties, FC, ReactNode} from 'react';
import type {Look} from './looks';
import {shade} from './looks';
import type {Pose} from './rig';
import {BODY, armChain, idle, legChain, reach} from './rig';

export type HeldItem = 'book' | 'tablet' | 'folder' | 'plans' | 'none';

interface PersonProps {
	readonly look: Look;
	readonly pose: Pose;
	readonly frame: number;
	/** Varie respiration et clignements d'un personnage à l'autre. */
	readonly seed?: number;
	/** 1 = tourné vers la droite, -1 = vers la gauche. */
	readonly facing?: 1 | -1;
	readonly held?: HeldItem;
	readonly heldColor?: string;
	readonly shadow?: boolean;
}

const INK_EYE = '#1B1416';
const LIP = '#7A3A30';

/** Membre dessiné comme un trait épais à bouts ronds (style aplat). */
const Limb: FC<{from: {x: number; y: number}; to: {x: number; y: number}; width: number; color: string}> = ({from, to, width, color}) => (
	<line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={color} strokeWidth={width} strokeLinecap="round" />
);

const Shoe: FC<{at: {x: number; y: number}; color: string}> = ({at, color}) => (
	<g>
		<path
			d={`M ${at.x - 15} ${at.y - 4} Q ${at.x - 18} ${at.y + 14} ${at.x - 8} ${at.y + 9} L ${at.x + 36} ${at.y + 9} Q ${at.x + 44} ${at.y + 4} ${at.x + 34} ${at.y - 5} Q ${at.x + 16} ${at.y - 12} ${at.x + 6} ${at.y - 12} Z`}
			fill={color}
		/>
		<path d={`M ${at.x - 12} ${at.y + 8} L ${at.x + 38} ${at.y + 8}`} stroke={shade(color, 0.25)} strokeWidth={4} strokeLinecap="round" />
	</g>
);

const TORSO =
	'M -32 -482 Q 4 -492 38 -482 Q 56 -474 53 -446 L 43 -342 Q 44 -312 46 -288 L -44 -286 Q -42 -320 -40 -350 L -48 -446 Q -50 -476 -32 -482 Z';

const Hair: FC<{look: Look; hc: {x: number; y: number}; layer: 'back' | 'front'}> = ({look, hc, layer}) => {
	const c = look.hairColor;
	const x = hc.x;
	const y = hc.y;
	// Calotte commune : encadre le front et couvre l'arrière du crâne.
	const cap = `M ${x + 34} ${y - 22} Q ${x + 20} ${y - 52} ${x - 8} ${y - 50} Q ${x - 44} ${y - 44} ${x - 44} ${y - 4} Q ${x - 42} ${y + 16} ${x - 32} ${y + 22} L ${x - 24} ${y - 2} Q ${x - 16} ${y - 22} ${x + 2} ${y - 26} Q ${x + 20} ${y - 30} ${x + 34} ${y - 22} Z`;
	switch (look.hair) {
		case 'puff':
			return layer === 'back' ? (
				<g fill={c}>
					<circle cx={x - 12} cy={y - 58} r={33} />
					<circle cx={x + 6} cy={y - 66} r={22} />
					<circle cx={x - 30} cy={y - 44} r={20} />
				</g>
			) : (
				<g>
					<path d={cap} fill={c} />
					<ellipse cx={x - 8} cy={y - 40} rx={15} ry={5} fill="#E2A33B" transform={`rotate(-14 ${x - 8} ${y - 40})`} />
				</g>
			);
		case 'afro':
			return layer === 'back' ? (
				<g fill={c}>
					<circle cx={x - 6} cy={y - 18} r={62} />
					<circle cx={x - 40} cy={y + 8} r={34} />
					<circle cx={x + 22} cy={y - 50} r={36} />
				</g>
			) : (
				<path d={cap} fill={c} />
			);
		case 'braids':
			return layer === 'back' ? (
				<g stroke={c} strokeLinecap="round" fill="none">
					{[-34, -24, -14].map((dx, i) => (
						<path key={dx} d={`M ${x + dx} ${y - 10} Q ${x + dx - 10} ${y + 50} ${x + dx - 4 + i * 4} ${y + 112}`} strokeWidth={13} />
					))}
				</g>
			) : (
				<g>
					<path d={cap} fill={c} />
					{[0, 1, 2].map((i) => (
						<path key={i} d={`M ${x + 22 - i * 16} ${y - 40 + i * 4} Q ${x + 4 - i * 16} ${y - 34 + i * 6} ${x - 14 - i * 12} ${y - 20 + i * 8}`} stroke={shade(c, -0.6)} strokeWidth={2} fill="none" opacity={0.35} />
					))}
				</g>
			);
		case 'lowBun':
			return layer === 'back' ? (
				<circle cx={x - 44} cy={y + 6} r={19} fill={c} />
			) : (
				<path d={cap} fill={c} />
			);
		case 'curlyTop':
			return layer === 'back' ? null : (
				<g fill={c}>
					<path d={`M ${x + 30} ${y - 26} Q ${x + 12} ${y - 44} ${x - 10} ${y - 44} Q ${x - 42} ${y - 38} ${x - 42} ${y - 4} L ${x - 30} ${y + 12} L ${x - 24} ${y - 6} Q ${x - 10} ${y - 24} ${x + 30} ${y - 26} Z`} />
					{[-30, -14, 2, 18].map((dx, i) => (
						<circle key={dx} cx={x + dx} cy={y - 46 - (i % 2) * 5} r={13} />
					))}
				</g>
			);
		case 'short':
		case 'shortGrey':
			return layer === 'back' ? null : (
				<g>
					<path
						d={`M ${x + 32} ${y - 26} Q ${x + 14} ${y - 50} ${x - 10} ${y - 49} Q ${x - 42} ${y - 42} ${x - 42} ${y - 6} Q ${x - 40} ${y + 10} ${x - 32} ${y + 14} L ${x - 26} ${y - 4} Q ${x - 10} ${y - 26} ${x + 32} ${y - 26} Z`}
						fill={c}
					/>
					{look.hair === 'shortGrey' ? (
						<path d={`M ${x - 40} ${y - 14} Q ${x - 38} ${y + 6} ${x - 30} ${y + 12} L ${x - 27} ${y - 4} Z`} fill="#9DA3AE" />
					) : null}
				</g>
			);
		default:
			return null;
	}
};

const HeldProp: FC<{item: HeldItem; at: {x: number; y: number}; color: string}> = ({item, at, color}) => {
	switch (item) {
		case 'book':
			return (
				<g transform={`translate(${at.x - 6} ${at.y - 38}) rotate(-8)`}>
					<path d="M -46 6 L 0 0 L 0 62 L -46 70 Z" fill={color} />
					<path d="M 46 6 L 0 0 L 0 62 L 46 70 Z" fill={shade(color, 0.15)} />
					<path d="M -40 8 L -2 3 L -2 58 L -40 64 Z" fill="#FFFFFF" />
					<path d="M 40 8 L 2 3 L 2 58 L 40 64 Z" fill="#F1F3F8" />
					{[16, 26, 36, 46].map((y) => (
						<g key={y} stroke="#C9D1DF" strokeWidth={2.4} strokeLinecap="round">
							<line x1={-34} y1={y} x2={-8} y2={y - 3} />
							<line x1={8} y1={y - 3} x2={34} y2={y} />
						</g>
					))}
				</g>
			);
		case 'tablet':
			return (
				<g transform={`translate(${at.x - 2} ${at.y - 52}) rotate(-6)`}>
					<rect x={-38} y={0} width={76} height={100} rx={10} fill="#1C2433" />
					<rect x={-32} y={6} width={64} height={86} rx={6} fill={color} />
					<path d="M -24 70 L -8 52 L 6 62 L 24 36" stroke="#FFFFFF" strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.9} />
					<rect x={-24} y={16} width={30} height={6} rx={3} fill="#FFFFFF" opacity={0.7} />
				</g>
			);
		case 'folder':
			return (
				<g transform={`translate(${at.x - 4} ${at.y - 50}) rotate(-4)`}>
					<rect x={-36} y={0} width={72} height={92} rx={6} fill={color} />
					<rect x={-28} y={10} width={56} height={72} rx={3} fill="#FFFFFF" opacity={0.9} />
					{[24, 36, 48, 60].map((y) => (
						<line key={y} x1={-20} y1={y} x2={18} y2={y} stroke="#C9D1DF" strokeWidth={3} strokeLinecap="round" />
					))}
				</g>
			);
		case 'plans':
			return (
				<g transform={`translate(${at.x} ${at.y}) rotate(-32)`}>
					<rect x={-14} y={-78} width={28} height={130} rx={14} fill={color} />
					<ellipse cx={0} cy={-78} rx={14} ry={6} fill={shade(color, 0.2)} />
				</g>
			);
		default:
			return null;
	}
};

const Accessories: FC<{look: Look; hc: {x: number; y: number}}> = ({look, hc}) => {
	const {x, y} = hc;
	return (
		<>
			{look.glasses ? (
				<g fill="rgba(255,255,255,0.18)" stroke="#262631" strokeWidth={2.8}>
					<rect x={x + 1} y={y - 11} width={19} height={15} rx={5} />
					<rect x={x + 23} y={y - 12} width={15} height={14} rx={5} />
					<line x1={x + 20} y1={y - 5} x2={x + 23} y2={y - 5} />
					<line x1={x + 1} y1={y - 6} x2={x - 18} y2={y - 2} />
				</g>
			) : null}
			{look.beard ? (
				<g fill={look.hairColor}>
					<path d={`M ${x - 18} ${y + 16} Q ${x - 12} ${y + 46} ${x + 14} ${y + 50} Q ${x + 32} ${y + 46} ${x + 38} ${y + 26} Q ${x + 28} ${y + 36} ${x + 16} ${y + 37} Q ${x + 2} ${y + 35} ${x - 8} ${y + 22} Z`} />
					<path d={`M ${x + 12} ${y + 21} Q ${x + 24} ${y + 16} ${x + 36} ${y + 20} L ${x + 34} ${y + 25} Q ${x + 24} ${y + 22} ${x + 13} ${y + 26} Z`} />
				</g>
			) : null}
			{look.earrings ? <circle cx={x - 20} cy={y + 20} r={4.5} fill="#E2A33B" /> : null}
			{look.hardhat ? (
				<g>
					<path d={`M ${x - 44} ${y - 22} Q ${x - 40} ${y - 74} ${x + 4} ${y - 74} Q ${x + 44} ${y - 72} ${x + 46} ${y - 24} Z`} fill={look.hardhat} />
					<rect x={x - 52} y={y - 28} width={112} height={12} rx={6} fill={shade(look.hardhat, 0.15)} />
					<rect x={x - 6} y={y - 72} width={12} height={46} rx={6} fill={shade(look.hardhat, -0.25)} opacity={0.6} />
				</g>
			) : null}
			{look.mortarboard ? (
				<g>
					<path d={`M ${x - 34} ${y - 40} Q ${x - 30} ${y - 58} ${x + 4} ${y - 60} Q ${x + 36} ${y - 58} ${x + 38} ${y - 40} Z`} fill="#14284F" />
					<path d={`M ${x - 62} ${y - 60} L ${x + 6} ${y - 82} L ${x + 72} ${y - 62} L ${x + 4} ${y - 40} Z`} fill="#1B3566" />
					<circle cx={x + 6} cy={y - 62} r={4} fill={look.mortarboard} />
					<path d={`M ${x + 6} ${y - 62} Q ${x + 40} ${y - 58} ${x + 46} ${y - 24}`} stroke={look.mortarboard} strokeWidth={3.5} fill="none" />
					<rect x={x + 41} y={y - 26} width={10} height={20} rx={4} fill={look.mortarboard} />
				</g>
			) : null}
		</>
	);
};

/** Vêtement du buste (dessiné par-dessus la base du torse). */
const TopGarment: FC<{look: Look}> = ({look}) => {
	const c = look.topColor;
	const dark = shade(c, 0.12);
	switch (look.top) {
		case 'jacket':
		case 'cardigan':
		case 'blazer':
			return (
				<g>
					<path d="M -32 -482 Q -10 -489 6 -486 L 2 -286 L -44 -286 Q -42 -320 -40 -350 L -48 -446 Q -50 -476 -32 -482 Z" fill={c} />
					<path d="M 26 -485 Q 48 -480 53 -446 L 43 -342 Q 44 -312 46 -288 L 30 -288 Z" fill={dark} />
					{look.top === 'blazer' ? (
						<g fill={shade(c, 0.25)}>
							<path d="M 4 -486 L 14 -420 L -6 -448 Z" />
							<path d="M 26 -485 L 16 -420 L 34 -452 Z" />
						</g>
					) : null}
					{look.top === 'jacket' ? <path d="M -36 -400 L -8 -400" stroke={shade(c, 0.2)} strokeWidth={3} strokeLinecap="round" /> : null}
				</g>
			);
		case 'labcoat':
			return (
				<g>
					<path d="M -34 -482 Q -10 -489 4 -486 L 0 -150 L -58 -152 Q -54 -260 -52 -330 L -50 -448 Q -52 -476 -34 -482 Z" fill={c} />
					<path d="M 26 -485 Q 50 -480 54 -446 L 54 -330 Q 58 -230 60 -150 L 26 -150 Z" fill={shade(c, 0.06)} />
					<path d="M 4 -484 L 12 -430 L -6 -450 Z" fill={shade(c, 0.1)} />
					<rect x={-46} y={-300} width={32} height={26} rx={4} fill={shade(c, 0.07)} />
				</g>
			);
		case 'gown':
			return (
				<g>
					<path d="M -36 -484 Q 6 -494 40 -484 Q 58 -476 58 -446 L 70 -120 L -66 -120 L -54 -446 Q -54 -478 -36 -484 Z" fill={c} />
					<path d="M 2 -484 L 8 -300" stroke={shade(c, 0.25)} strokeWidth={3} />
					<path d="M -6 -484 L -12 -330 L 0 -326 L 4 -484 Z" fill={look.mortarboard ?? '#F0A01A'} />
					<path d="M 12 -484 L 22 -330 L 34 -334 L 22 -484 Z" fill={look.mortarboard ?? '#F0A01A'} />
				</g>
			);
		case 'hoodie':
			return (
				<g>
					<path d="M -50 -470 Q -48 -502 -8 -502 Q 12 -502 16 -488 Q -12 -480 -50 -470 Z" fill={dark} />
					<rect x={-26} y={-370} width={64} height={40} rx={13} fill={dark} />
					<line x1={8} y1={-474} x2={6} y2={-430} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
					<line x1={18} y1={-474} x2={20} y2={-432} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
				</g>
			);
		case 'shirt':
			return (
				<g>
					<path d="M 2 -484 L 12 -462 L 22 -484 Z" fill={shade(c, 0.18)} />
					<line x1={12} y1={-462} x2={10} y2={-296} stroke={shade(c, 0.18)} strokeWidth={3} />
				</g>
			);
		default:
			return null;
	}
};

/**
 * Personnage illustré (groupe SVG). Origine entre les pieds ; dessiné tourné vers la droite.
 */
export const PersonG: FC<PersonProps> = ({look, pose, frame, seed = 1, facing = 1, held = 'none', heldColor = '#1E8BE3', shadow = true}) => {
	const life = idle(frame, seed);
	const skin = look.skin;
	const skinBack = shade(skin, 0.14);
	const sleeve = look.top === 'tee' || look.top === 'shirt' ? look.topColor : look.top === 'gown' ? look.topColor : look.topColor;
	const sleeveBack = shade(sleeve, 0.14);
	const bottom = look.bottomColor;

	const hip = {x: 0, y: BODY.hipY + pose.bob};
	const backLeg = legChain({x: BODY.hipBackX, y: hip.y}, pose.backLeg);
	const frontLeg = legChain({x: BODY.hipFrontX, y: hip.y}, pose.frontLeg);

	// Respiration : très légère élévation des épaules et de la tête.
	const lift = life.breath * 2.4;
	const upper = `rotate(${pose.lean} 0 ${hip.y}) translate(0 ${pose.bob - lift})`;
	const shoulderFront = BODY.shoulderFront;
	const shoulderBack = BODY.shoulderBack;
	const frontArm = armChain(shoulderFront, {...pose.frontArm, shoulder: pose.frontArm.shoulder + life.sway * 1.5});
	const backArm = armChain(shoulderBack, {...pose.backArm, shoulder: pose.backArm.shoulder - life.sway * 1.2});
	const shortSleeves = !look.longSleeves;

	const hc = {x: BODY.head.x, y: BODY.head.y};
	const tilt = pose.headTilt + life.sway * 1.4;
	const eyeY = life.blink ? 0.7 : 5.4;
	const lx = pose.lookX * 3;
	const ly = -pose.lookY * 3;

	const arm = (chain: typeof frontArm, front: boolean): ReactNode => {
		const sleeveColor = front ? sleeve : sleeveBack;
		const skinColor = front ? skin : skinBack;
		const mid = reach(chain.shoulder, front ? pose.frontArm.shoulder : pose.backArm.shoulder, BODY.upperArm * 0.55);
		const handCenter = reach(chain.elbow, chain.handAngle, BODY.forearm + 6);
		const wide = look.top === 'gown';
		return (
			<g>
				{shortSleeves ? (
					<>
						<Limb from={chain.shoulder} to={chain.elbow} width={27} color={skinColor} />
						<Limb from={chain.shoulder} to={mid} width={37} color={sleeveColor} />
						<Limb from={chain.elbow} to={chain.hand} width={25} color={skinColor} />
					</>
				) : (
					<>
						<Limb from={chain.shoulder} to={chain.elbow} width={wide ? 44 : 35} color={sleeveColor} />
						<Limb from={chain.elbow} to={chain.hand} width={wide ? 42 : 30} color={sleeveColor} />
					</>
				)}
				<circle cx={handCenter.x} cy={handCenter.y} r={15} fill={skinColor} />
			</g>
		);
	};

	return (
		<g transform={facing === -1 ? 'scale(-1 1)' : undefined}>
			{shadow ? <ellipse cx={6} cy={10} rx={82} ry={13} fill="rgba(12, 32, 70, 0.13)" /> : null}

			{/* Jambes */}
			<Limb from={backLeg.hip} to={backLeg.knee} width={52} color={shade(bottom, 0.16)} />
			<Limb from={backLeg.knee} to={backLeg.ankle} width={44} color={shade(bottom, 0.16)} />
			<Shoe at={backLeg.ankle} color={shade(look.shoeColor, 0.12)} />
			<Limb from={frontLeg.hip} to={frontLeg.knee} width={54} color={bottom} />
			<Limb from={frontLeg.knee} to={frontLeg.ankle} width={46} color={bottom} />
			<Shoe at={frontLeg.ankle} color={look.shoeColor} />
			<rect x={-46} y={hip.y - 24} width={94} height={52} rx={24} fill={bottom} />

			<g transform={upper}>
				{look.backpack ? <rect x={-84} y={-472} width={48} height={132} rx={17} fill={shade(look.backpack, 0.1)} /> : null}
				{arm(backArm, false)}
				<g transform={`rotate(${tilt} 12 -494) translate(${hc.x} ${hc.y}) scale(1.05) translate(${-hc.x} ${-hc.y})`}>
					<Hair look={look} hc={hc} layer="back" />
				</g>

				{/* Buste */}
				<path d={TORSO} fill={look.top === 'tee' || look.top === 'shirt' || look.top === 'hoodie' ? look.topColor : look.innerColor} />
				<TopGarment look={look} />
				{look.backpack ? <path d="M 36 -480 Q 40 -430 28 -380" stroke={look.backpack} strokeWidth={10} strokeLinecap="round" fill="none" /> : null}
				{look.lanyard ? (
					<g>
						<path d="M -4 -478 L 10 -400 L 24 -478" stroke={look.lanyard} strokeWidth={4} fill="none" />
						<rect x={-2} y={-402} width={24} height={32} rx={4} fill="#FFFFFF" />
						<rect x={-2} y={-402} width={24} height={9} rx={3} fill={look.lanyard} />
					</g>
				) : null}

				{/* Cou et tête */}
				<rect x={0} y={-500} width={24} height={30} rx={10} fill={skinBack} />
				<g transform={`rotate(${tilt} 12 -494)`}>
					<ellipse cx={hc.x - 24} cy={hc.y + 4} rx={8} ry={12} fill={skinBack} />
					<ellipse cx={hc.x} cy={hc.y} rx={BODY.head.rx} ry={BODY.head.ry} fill={skin} />
					<path d={`M ${hc.x + 34} ${hc.y + 2} Q ${hc.x + 44} ${hc.y + 14} ${hc.x + 34} ${hc.y + 18}`} stroke={skinBack} strokeWidth={3.2} fill="none" strokeLinecap="round" />
					<circle cx={hc.x + 22} cy={hc.y + 14} r={7} fill="rgba(214, 90, 80, 0.14)" />
					<ellipse cx={hc.x + 10 + lx} cy={hc.y - 3 + ly} rx={4.3} ry={eyeY} fill={INK_EYE} />
					<ellipse cx={hc.x + 30 + lx * 0.8} cy={hc.y - 4 + ly} rx={3.7} ry={eyeY * 0.95} fill={INK_EYE} />
					<g stroke={look.hairColor} strokeWidth={3.6} strokeLinecap="round" fill="none">
						<path d={`M ${hc.x + 3} ${hc.y - 15 + ly * 0.5} Q ${hc.x + 10} ${hc.y - 19 + ly * 0.5} ${hc.x + 17} ${hc.y - 16 + ly * 0.5}`} />
						<path d={`M ${hc.x + 25} ${hc.y - 17 + ly * 0.5} Q ${hc.x + 31} ${hc.y - 20 + ly * 0.5} ${hc.x + 36} ${hc.y - 16 + ly * 0.5}`} />
					</g>
					<path
						d={`M ${hc.x + 12} ${hc.y + 24} Q ${hc.x + 21} ${hc.y + 27 + pose.smile * 6} ${hc.x + 31} ${hc.y + 23}`}
						stroke={LIP}
						strokeWidth={3.2}
						strokeLinecap="round"
						fill="none"
					/>
					<g transform={`translate(${hc.x} ${hc.y}) scale(1.05) translate(${-hc.x} ${-hc.y})`}>
						<Hair look={look} hc={hc} layer="front" />
					</g>
					<Accessories look={look} hc={hc} />
				</g>

				{held !== 'none' ? <HeldProp item={held} at={frontArm.hand} color={heldColor} /> : null}
				{arm(frontArm, true)}
			</g>
		</g>
	);
};

interface PersonOverlayProps extends PersonProps {
	/** Position des pieds dans le repère du parent (px). */
	readonly x: number;
	readonly y: number;
	readonly scale: number;
	readonly style?: CSSProperties;
}

const VIEW = {x: -200, y: -760, w: 400, h: 800} as const;

/** Personnage autonome positionné en HTML (svg dédié). */
export const Person: FC<PersonOverlayProps> = ({x, y, scale, style, ...props}) => (
	<svg
		viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
		width={VIEW.w * scale}
		height={VIEW.h * scale}
		style={{position: 'absolute', left: x + VIEW.x * scale, top: y + VIEW.y * scale, overflow: 'visible', ...style}}
	>
		<PersonG {...props} />
	</svg>
);
