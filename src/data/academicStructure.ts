/**
 * Structure académique de l'Université d'Androna : Domaine → Mention → Parcours.
 *
 * Source : references/organigramme-androna.jpg (organigramme académique fourni).
 * Tous les intitulés ont été vérifiés sur l'image. Écarts volontaires, limités à
 * l'orthographe :
 * - DGE : l'image écrit « l'Environement » ; on retient « l'Environnement »,
 *   graphie utilisée partout ailleurs dans le même organigramme (GED, SVE, SEGA, SVTE).
 * - ECO / EM : l'image écrit « Economie » ; on retient « Économie »
 *   (accentuation des capitales, conforme aux données fournies avec la commande).
 * - Les apostrophes droites sont remplacées par l'apostrophe typographique (’).
 *
 * Ce fichier ne contient que des données : aucune logique d'affichage.
 */

export type DomainId = 'alsh' | 'st' | 'ss' | 'si';

export interface Program {
	readonly code: string;
	readonly label: string;
}

export interface Mention {
	readonly code: string;
	readonly label: string;
	readonly programs: readonly Program[];
}

export interface Domain {
	readonly id: DomainId;
	readonly code: string;
	readonly label: string;
	readonly mentions: readonly Mention[];
}

export const UNIVERSITY = {
	name: 'Université d’Androna',
	/** Découpage du nom pour les compositions typographiques sur deux lignes. */
	nameLines: ['Université', 'd’Androna'],
	chartTitle: 'Organigramme académique',
} as const;

export const ACADEMIC_STRUCTURE: readonly Domain[] = [
	{
		id: 'alsh',
		code: 'ALSH',
		label: 'Arts, Lettres et Sciences Humaines',
		mentions: [
			{
				code: 'HIST',
				label: 'Histoire',
				programs: [
					{code: 'HP', label: 'Histoire politique'},
					{code: 'HS', label: 'Histoire des Sociétés'},
				],
			},
			{
				code: 'GEO',
				label: 'Géographie',
				programs: [
					{code: 'GDD', label: 'Géographie et Développement Durable'},
					{code: 'GT', label: 'Géographie du Tourisme'},
				],
			},
			{
				code: 'SH',
				label: 'Sciences Humaines (Port-Bergé)',
				programs: [
					{code: 'ATR', label: 'Anthropologie'},
					{code: 'HISTO', label: 'Histoire'},
				],
			},
		],
	},
	{
		id: 'st',
		code: 'ST',
		label: 'Sciences et Technologies',
		mentions: [
			{
				code: 'SADD',
				label: 'Sciences Agronomiques et Développement Durable',
				programs: [
					{code: 'GED', label: 'Génie de l’Environnement et Développement Durable'},
					{code: 'PAD', label: 'Production Animale Durable'},
					{code: 'PVD', label: 'Production Végétale Durable'},
				],
			},
			{
				code: 'SVTE',
				label: 'Sciences de la Vie, de la Terre et de l’Environnement',
				programs: [
					{code: 'SVE', label: 'Sciences de la Vie et de l’Environnement'},
					{code: 'BVRN', label: 'Biochimie et Valorisation des Ressources Naturelles'},
					{code: 'SEGA', label: 'Sciences de l’Environnement et Géologie Appliquée'},
				],
			},
		],
	},
	{
		id: 'ss',
		code: 'SS',
		label: 'Sciences de la Société',
		mentions: [
			{
				code: 'DROIT',
				label: 'Droit',
				programs: [
					{code: 'D.Pr', label: 'Droit Privé'},
					{code: 'D.Pu', label: 'Droit Public'},
					{code: 'DGE', label: 'Droit et Gestion de l’Environnement'},
				],
			},
			{
				code: 'ECO',
				label: 'Économie',
				programs: [
					{code: 'ADE', label: 'Administration économique'},
					{code: 'ANE', label: 'Analyse économique'},
					{code: 'EM', label: 'Économie mathématique'},
				],
			},
		],
	},
	{
		id: 'si',
		code: 'SI',
		label: 'Sciences de l’Ingénieur',
		mentions: [
			{
				code: 'HYDRAU',
				label: 'Hydraulique',
				programs: [
					{code: 'GR', label: 'Génie Rural'},
					{code: 'HA', label: 'Hydraulique et aménagement'},
				],
			},
			{
				code: 'TOPO',
				label: 'Topographique',
				programs: [
					{code: 'IGF', label: 'Information Géographique et Foncières'},
					{code: 'Géo-Topo', label: 'Géomètre Topographe'},
					{code: 'SFAT', label: 'Sécurisation foncière et aménagement du territoire'},
				],
			},
			{
				code: 'GG',
				label: 'Génie Géologique',
				programs: [
					{code: 'GM', label: 'Géologie Minière'},
					{code: 'Géo-T', label: 'Géotechnique'},
					{code: 'Géo-E', label: 'Géo-énergie'},
				],
			},
		],
	},
];

export interface StructureStats {
	readonly domains: number;
	readonly mentions: number;
	readonly programs: number;
}

/** Statistiques calculées depuis les données (jamais saisies à la main). */
export const getStructureStats = (domains: readonly Domain[] = ACADEMIC_STRUCTURE): StructureStats => ({
	domains: domains.length,
	mentions: domains.reduce((sum, d) => sum + d.mentions.length, 0),
	programs: domains.reduce(
		(sum, d) => sum + d.mentions.reduce((s, m) => s + m.programs.length, 0),
		0,
	),
});
