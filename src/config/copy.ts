/**
 * Textes éditoriaux de la vidéo (hors données académiques).
 *
 * VIDEO_TAGLINE est une simple accroche de la vidéo : ce n'est PAS un slogan
 * officiel de l'Université d'Androna. La remplacer par la devise officielle
 * si l'université en fournit une.
 */
export const VIDEO_TAGLINE = ['Construire son parcours.', 'Préparer son avenir.'] as const;

export const LEVEL_LABELS = {
	domains: {label: 'Domaines', detail: null},
	mentions: {label: 'Mentions', detail: null},
	programs: {label: 'Parcours', detail: 'de formation'},
} as const;

export const DOMAIN_TAG = 'Domaine';

/**
 * Domaines professionnels symboliques associés à chaque domaine (scène « avenir »).
 * Ce sont des champs d'activité génériques tirés des mentions, sans promesse
 * d'emploi ni statistique.
 */
export const FUTURE_FIELDS = {
	alsh: ['Recherche', 'Territoires'],
	st: ['Environnement', 'Agronomie'],
	ss: ['Droit', 'Économie'],
	si: ['Ingénierie', 'Géosciences'],
} as const;

/** Contenu du tableau numérique de la scène « ensemble ». */
export const BOARD = {
	title: 'Accompagnés à chaque étape',
	items: ['Apprentissage', 'Découverte', 'Innovation'],
} as const;

/** Appel à l'action de la carte de fin (aucune donnée de contact inventée). */
export const CALL_TO_ACTION = 'Découvrez nos formations';
