// Configuration du rendu Remotion (CLI et Studio).
// https://www.remotion.dev/docs/config
import {Config} from '@remotion/cli/config';

Config.setEntryPoint('src/index.ts');
Config.setVideoImageFormat('jpeg');
// Qualité élevée des images intermédiaires : beaucoup de texte fin à préserver.
Config.setJpegQuality(95);
// CRF, format de pixel et codec audio sont passés par les scripts npm (render, render:4k),
// ce qui laisse possibles les rendus audio seuls de contrôle du mixage.
Config.setCodec('h264');
Config.setOverwriteOutput(true);
