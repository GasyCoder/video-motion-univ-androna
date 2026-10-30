import type {LucideIcon} from 'lucide-react';
import {BookOpen, Cog, Leaf, Scale} from 'lucide-react';
import type {DomainId} from '../data/academicStructure';

/**
 * Identité chromatique de chaque domaine, reprise de l'organigramme original
 * (bleu ALSH, vert ST, jaune/orange SS, violet SI) et déclinée en nuances.
 */
export interface DomainTheme {
	/** Couleur signature, saturée. */
	readonly primary: string;
	/** Version foncée : acronymes sur fond clair. */
	readonly deep: string;
	/** Couleur des connecteurs (opaque, pour que les tracés superposés restent invisibles). */
	readonly line: string;
	/** Bordures des cartes parcours. */
	readonly soft: string;
	/** Fond des cartes parcours. */
	readonly tint: string;
	/** Dégradé de la grande carte domaine. */
	readonly gradient: readonly [string, string];
	readonly Icon: LucideIcon;
}

export const DOMAIN_THEMES: Record<DomainId, DomainTheme> = {
	alsh: {
		primary: '#1E8BE3',
		deep: '#0B4C97',
		line: '#86C2F1',
		soft: '#CBE4FA',
		tint: '#F1F8FF',
		gradient: ['#2E9EF0', '#0F5BB4'],
		Icon: BookOpen,
	},
	st: {
		primary: '#33A33B',
		deep: '#1A6420',
		line: '#8DCF87',
		soft: '#D0EDCB',
		tint: '#F2FAF0',
		gradient: ['#4BBA47', '#1D7A2B'],
		Icon: Leaf,
	},
	ss: {
		primary: '#F0A01A',
		deep: '#9A5600',
		line: '#F4C873',
		soft: '#F9E2B4',
		tint: '#FFF8EA',
		gradient: ['#F8B734', '#DD780B'],
		Icon: Scale,
	},
	si: {
		primary: '#7B4FD8',
		deep: '#4A2A9E',
		line: '#BCA4EF',
		soft: '#E1D5FA',
		tint: '#F7F3FF',
		gradient: ['#9165E9', '#5531B7'],
		Icon: Cog,
	},
};
