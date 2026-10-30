// Point d'entrée regroupé par esbuild : exporte la timeline calculée en JSON
// pour que la musique soit composée sur les vraies sections de la vidéo.
import {DOMAIN_PLANS, FINAL, FUTURES, GATEWAY, HOOK, OUTRO, TOGETHER, TOTAL_DURATION, VOICE_PLACEMENT} from '../../src/timeline/timeline';
import {NARRATION, SEGMENT_IDS, speechEnd} from '../../src/narration/narration';
import {VIDEO} from '../../src/config/video';

const timeline = {
	fps: VIDEO.fps,
	total: TOTAL_DURATION,
	sections: {
		hook: 0,
		gateway: HOOK.gatewayAt,
		domains: GATEWAY.exitAt,
		futures: FUTURES.from,
		together: TOGETHER.from,
		final: FINAL.from,
		build: FINAL.buildAt,
		outro: OUTRO.from,
	},
	domainTravels: DOMAIN_PLANS.map((p) => p.travel.from),
	voice: SEGMENT_IDS.map((id) => ({id, from: VOICE_PLACEMENT[id], speechEnd: VOICE_PLACEMENT[id] + speechEnd(id), frames: NARRATION[id].frames})),
};
console.log(JSON.stringify(timeline));
