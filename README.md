# Université d'Androna — Vidéo d'orientation (motion design)

Vidéo verticale d'orientation universitaire (1080 × 1920, 9:16, 30 fps, master 4K
2160 × 3840) réalisée avec Remotion, React et TypeScript : personnages illustrés,
organigramme académique animé, voix off française, musique, effets sonores et
sous-titres. L'organigramme officiel (`references/organigramme-androna.jpg`) est
entièrement reconstruit en composants : aucune image source n'est utilisée.

## Commandes

```bash
npm install                     # dépendances + polices locales
python3 -m venv --system-site-packages .venv && .venv/bin/pip install edge-tts piper-tts
                                # outils Python (voix ; numpy, scipy, torch, transformers requis)
npm run voice                   # voix off → public/audio/narration + src/narration/narration.generated.json
npm run music                   # musique et effets originaux calés sur la timeline
npm run dev                     # Remotion Studio
npm run check                   # TypeScript strict + bundle
npm run render                  # → out/androna-orientation-1080x1920.mp4 (H.264 + AAC, diffusion)
npm run render:4k               # → out/androna-orientation-2160x3840.mp4 (master 4K natif, H.265 « hvc1 »)
npm run stills -- 300 900       # images de contrôle → out/stills/
.venv/bin/python scripts/audio/analyze-mix.py voice.wav music.wav sfx.wav final.mp4
                                # contrôle du mixage (couches rendues avec audioMix)
```

Compositions du Studio : `AndronaAcademicMotion` (diffusion), `AndronaAcademicMotion-4K`
(master), `AndronaAcademicMotion-SafeArea` (zones des interfaces Reels / TikTok),
`Dev-CharacterSheet` (planche du système de personnages). La propriété `audioMix`
(`all`, `voice`, `music`, `sfx`) isole une couche audio pour le contrôle du mixage.

## Récit (piloté par la voix off)

Ton publicitaire, voix quasi continue (~166 mots/min, pauses resserrées), 38,6 s.

| Scène | Voix off | Image |
| --- | --- | --- |
| 01 Accroche | « Nouveaux bacheliers ? Quelle formation choisir ? Quel parcours pour votre avenir ? » | Titre animé lettre à lettre ; l'étudiante entre, deux bulles de questions |
| 02 Université | « La réponse : l'Université d'Androna ! Quatre domaines, dix mentions, vingt-six parcours ! » | Le bandeau se pose sur le nom ; chaque chiffre claque sur son mot (compteur) ; la rythmique entre |
| 03–06 Domaines | « Arts, Lettres et Sciences Humaines : histoire, géographie, anthropologie. » … | Vignette illustrée, carte et arbre des mentions / parcours ; balayage diagonal à la sortie |
| 07 Avenir | « Des parcours conçus pour votre projet d'études et votre avenir professionnel ! » | Chemins vers quatre avenirs symboliques |
| 08 Ensemble | « Étudiants, enseignants et équipes universitaires : ensemble, on apprend, on découvre et on innove ! » | Enseignant au tableau ; les trois pictogrammes tombent sur « apprend », « découvre », « innove » |
| 09 Révélation | « Alors, explorez nos formations, choisissez votre parcours et construisez votre avenir… » | Toute la structure ; des étudiants arrivent ; l'étudiante devient diplômée |
| 10 Fin | « …avec l'Université d'Androna ! » | Carte de fin ; un curseur clique sur « Découvrez nos formations » ; accroche de campagne |

Les énumérations des scènes 03–06 reprennent les intitulés des mentions et parcours
des données : aucune information n'est inventée.

La timeline (`src/timeline/timeline.ts`) se calcule à partir des durées mesurées de la
voix et de l'instant où certains mots sont prononcés (`wordAt`). Régénérer la voix
recale automatiquement toute la vidéo, sous-titres et effets compris.

## Audio

Trois couches, priorité **voix > musique > effets** (`src/audio/`) :

- **Voix** : un clip par segment, compressé en douceur puis normalisé à -15 LUFS
  (limiteur de crête, -1,8 dBTP), joué à -1,5 dB dans le mix.
- **Musique** : lit à -6 dB, atténué de 8 dB de plus pendant la voix (ducking avec
  attaque et relâchement adoucis), fondus d'entrée et de sortie.
- **Effets** : transitions clés (balayages, trajets caméra, cartes domaine, chiffres,
  révélation, diplôme, clic final).

Mesures sur le rendu : voir la section « Contrôle qualité » ci-dessous.

### Voix off : génération

`scripts/narration/generate.py` choisit le premier fournisseur disponible
(ou celui de `NARRATION_PROVIDER`) ; aucune clé n'est écrite dans le code :

1. **ElevenLabs** si `ELEVENLABS_API_KEY` et `ELEVENLABS_VOICE_ID` sont définies.
2. **Azure AI Speech** si `AZURE_SPEECH_KEY` et `AZURE_SPEECH_REGION` sont définies :
   voix neuronale `fr-FR-RemyMultilingualNeural`, sous licence commerciale.
3. **edge-tts** (sans clé) : la même voix Microsoft via le service de lecture à voix
   haute d'Edge, avec horodatage mot à mot. C'est la voix du rendu actuel.
4. **Piper** (local, open source) en dernier recours.

Réglages dans `scripts/narration/voice.config.json` : débit `+20 %`, pauses resserrées
à 0,16 s après un point et 0,08 s après une virgule (la coupe se fait au milieu du
silence, le débit des syllabes n'est pas modifié). Chaque prise est vérifiée par
reconnaissance vocale (Whisper). `--only alsh,st` régénère certains segments seulement.

### Musique et effets

`scripts/audio/compose.py` compose une musique instrumentale **originale** de style
publicitaire (ré majeur, 120 BPM : grosse caisse, claps, charleston, basse pulsée,
pad en sidechain) sur les sections réelles de la vidéo, et synthétise les six effets. Pour la
remplacer par une piste libre de droits ou sous licence, déposer le fichier à
`public/audio/music/orientation-theme.mp3`.

## Licences et attributions

- Voix du rendu actuel : voix neuronale Microsoft `fr-FR-RemyMultilingualNeural`
  obtenue via edge-tts (service de lecture à voix haute d'Edge). **Version de travail** :
  pour une diffusion officielle, régénérer la même voix avec Azure AI Speech (licence
  commerciale de l'abonnement) ou ElevenLabs, puis `npm run music` et les rendus.
- Voix de secours : modèle Piper `fr_FR-mls-medium` (Multilingual LibriSpeech,
  **CC BY 4.0**, attribution requise).
- Musique et effets : créations originales du projet (synthèse numérique), sans droit tiers.
- Polices Inter et Montserrat : SIL Open Font License.
- Icônes : Lucide (ISC).

## Vérification des intitulés

Tous les intitulés ont été relus sur l'image source. Seuls écarts, orthographiques :
« l'Environement » → « l'Environnement » (DGE) ; « Economie » → « Économie » (ECO, EM) ;
apostrophes typographiques. « Topographique » et la casse d'origine sont conservés.

L'accroche « Construire son parcours. Préparer son avenir. » et l'appel « Découvrez nos
formations » sont des textes de campagne, **pas** un slogan officiel de l'université.
Aucune coordonnée, date ou statistique d'emploi n'est affichée ; les domaines
professionnels de la scène 07 sont des champs d'activité génériques.

## Contrôle qualité

Voir le rapport de livraison (mesures sur les MP4 rendus : loudness, true peak,
écart voix / musique, transcription du mix final, décodage matériel).

## Lecture dans VLC

Le master 4K est en **H.265** : en H.264, le VLC Flatpak se rabat sur le décodage
matériel VDPAU, qui affiche un écran vert sur une vidéo verticale 2160 × 3840 avec un
GPU Intel. Si un écran vert apparaît malgré tout : Outils → Préférences → Entrée /
Codecs → Décodage matériel → Désactiver. La version 1080 × 1920 (H.264) est celle à
publier sur les réseaux sociaux.

## Limites connues

- **Voix** : voix neuronale naturelle, mais obtenue sans clé via edge-tts ; pour la
  diffusion commerciale, utiliser Azure AI Speech (même voix) ou ElevenLabs.
- La voix et la musique se régénèrent ensemble : `npm run voice && npm run music`.
