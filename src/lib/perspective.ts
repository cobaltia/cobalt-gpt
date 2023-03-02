// @ts-expect-error: no types
import Perspective from 'perspective-api-client';
import { parsePerspectiveAPIKey } from '#root/config';

const perspective = new Perspective({ apiKey: parsePerspectiveAPIKey() });

export async function analyzeMessage(message: string) {
	const result = await perspective.analyze(message, { attributes: ['SEVERE_TOXICITY'] });
	return result.attributeScores.SEVERE_TOXICITY.summaryScore.value > 0.7;
}
