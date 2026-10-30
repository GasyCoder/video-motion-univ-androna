/**
 * Apparence des personnages : système d'illustration commun (mêmes proportions,
 * aplats sans contour, membres arrière légèrement assombris), décliné en tenues.
 */
export type HairStyle = 'puff' | 'braids' | 'afro' | 'short' | 'curlyTop' | 'lowBun' | 'shortGrey';
export type TopStyle = 'tee' | 'jacket' | 'shirt' | 'blazer' | 'hoodie' | 'cardigan' | 'labcoat' | 'gown';

export interface Look {
	readonly skin: string;
	readonly hair: HairStyle;
	readonly hairColor: string;
	readonly top: TopStyle;
	readonly topColor: string;
	/** Couleur visible sous une veste / blouse ouverte. */
	readonly innerColor: string;
	readonly longSleeves: boolean;
	readonly bottomColor: string;
	readonly shoeColor: string;
	readonly glasses?: boolean;
	readonly beard?: boolean;
	readonly earrings?: boolean;
	readonly backpack?: string;
	readonly lanyard?: string;
	readonly hardhat?: string;
	/** Mortier de diplômé (couleur de l'étole). */
	readonly mortarboard?: string;
}

const SKIN = {
	deep: '#6B4330',
	brown: '#8A5A3C',
	warm: '#9C6744',
	medium: '#B47C55',
	light: '#C99470',
} as const;

const HAIR = '#1C1618';

/** Étudiante principale : guide de la vidéo. */
export const MAIN_STUDENT: Look = {
	skin: SKIN.warm,
	hair: 'puff',
	hairColor: HAIR,
	top: 'jacket',
	topColor: '#E7D6B8',
	innerColor: '#FFFFFF',
	longSleeves: true,
	bottomColor: '#23365C',
	shoeColor: '#F4F6FA',
	earrings: true,
	backpack: '#2C4A7E',
};

export const CAST = {
	mainStudent: MAIN_STUDENT,
	/** Variantes de l'étudiante principale selon le domaine exploré. */
	mainStudentLab: {...MAIN_STUDENT, top: 'labcoat', topColor: '#FBFCFE', innerColor: '#E7D6B8', backpack: undefined},
	mainStudentSite: {...MAIN_STUDENT, hardhat: '#F2B233', backpack: undefined},
	graduate: {...MAIN_STUDENT, top: 'gown', topColor: '#14284F', innerColor: '#FFFFFF', backpack: undefined, mortarboard: '#F0A01A'},
	studentA: {
		skin: SKIN.brown,
		hair: 'short',
		hairColor: HAIR,
		top: 'hoodie',
		topColor: '#3E8E5C',
		innerColor: '#2C6B44',
		longSleeves: true,
		bottomColor: '#2B2F3A',
		shoeColor: '#E9ECF2',
		glasses: true,
		backpack: '#1E2E4D',
	},
	studentB: {
		skin: SKIN.deep,
		hair: 'afro',
		hairColor: HAIR,
		top: 'tee',
		topColor: '#7B4FD8',
		innerColor: '#7B4FD8',
		longSleeves: false,
		bottomColor: '#30364A',
		shoeColor: '#F4F6FA',
		earrings: true,
	},
	studentC: {
		skin: SKIN.medium,
		hair: 'curlyTop',
		hairColor: HAIR,
		top: 'shirt',
		topColor: '#F2A53A',
		innerColor: '#F2A53A',
		longSleeves: false,
		bottomColor: '#3A4560',
		shoeColor: '#2B2F3A',
	},
	studentD: {
		skin: SKIN.light,
		hair: 'braids',
		hairColor: HAIR,
		top: 'cardigan',
		topColor: '#1E8BE3',
		innerColor: '#FFFFFF',
		longSleeves: true,
		bottomColor: '#2B2F3A',
		shoeColor: '#F4F6FA',
	},
	teacher: {
		skin: SKIN.brown,
		hair: 'shortGrey',
		hairColor: '#2A2426',
		top: 'blazer',
		topColor: '#1F3466',
		innerColor: '#DCE8F7',
		longSleeves: true,
		bottomColor: '#2A3550',
		shoeColor: '#2B1E19',
		glasses: true,
		beard: true,
	},
	staff: {
		skin: SKIN.deep,
		hair: 'lowBun',
		hairColor: HAIR,
		top: 'cardigan',
		topColor: '#8E6FD8',
		innerColor: '#F5F1FF',
		longSleeves: true,
		bottomColor: '#2E3448',
		shoeColor: '#2B1E19',
		lanyard: '#1E8BE3',
	},
	/** Avenirs professionnels symboliques (mêmes étudiants, quelques années plus tard). */
	proResearch: {
		skin: SKIN.light,
		hair: 'braids',
		hairColor: HAIR,
		top: 'blazer',
		topColor: '#1E5FA8',
		innerColor: '#FFFFFF',
		longSleeves: true,
		bottomColor: '#2B2F3A',
		shoeColor: '#2B1E19',
		glasses: true,
	},
	proEnvironment: {
		skin: SKIN.deep,
		hair: 'afro',
		hairColor: HAIR,
		top: 'labcoat',
		topColor: '#FBFCFE',
		innerColor: '#3E9A45',
		longSleeves: true,
		bottomColor: '#30364A',
		shoeColor: '#2B2F3A',
		earrings: true,
	},
	proLaw: {
		skin: SKIN.medium,
		hair: 'curlyTop',
		hairColor: HAIR,
		top: 'blazer',
		topColor: '#2A2F45',
		innerColor: '#F6E7C8',
		longSleeves: true,
		bottomColor: '#2A2F45',
		shoeColor: '#2B1E19',
	},
	proEngineer: {
		skin: SKIN.brown,
		hair: 'short',
		hairColor: HAIR,
		top: 'shirt',
		topColor: '#5B3FB8',
		innerColor: '#5B3FB8',
		longSleeves: true,
		bottomColor: '#2B2F3A',
		shoeColor: '#2B1E19',
		hardhat: '#F2B233',
	},
} satisfies Record<string, Look>;

export type CastName = keyof typeof CAST;

/** Assombrit une couleur #RRGGBB (membres arrière, ombres internes). */
export const shade = (hex: string, amount: number): string => {
	const v = hex.replace('#', '');
	const c = [0, 2, 4].map((i) => Math.round(parseInt(v.slice(i, i + 2), 16) * (1 - amount)));
	return `#${c.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
};
