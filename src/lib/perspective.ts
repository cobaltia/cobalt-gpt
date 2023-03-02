// @ts-expect-error: no types
import Perspective from 'perspective-api-client';
import { parsePerspectiveAPIKey } from '#root/config';

const perspective = new Perspective({ apiKey: parsePerspectiveAPIKey() });

export async function analyzeMessage(message: string) {
	return scoreMessage(message);
}

async function scoreMessage(message: string): Promise<AnalyzeMessageResult> {
	const result = await perspective.analyze(message, {
		attributes: ['TOXICITY', 'SEVERE_TOXICITY', 'IDENTITY_ATTACK', 'INSULT', 'PROFANITY', 'THREAT'],
	});
	return {
		attributes: {
			TOXICITY: result.attributeScores.TOXICITY.summaryScore.value,
			SEVERE_TOXICITY: result.attributeScores.SEVERE_TOXICITY.summaryScore.value,
			IDENTITY_ATTACK: result.attributeScores.IDENTITY_ATTACK.summaryScore.value,
			INSULT: result.attributeScores.INSULT.summaryScore.value,
			PROFANITY: result.attributeScores.PROFANITY.summaryScore.value,
			THREAT: result.attributeScores.THREAT.summaryScore.value,
		},
		score: [
			result.attributeScores.TOXICITY.summaryScore.value > 0.9,
			result.attributeScores.SEVERE_TOXICITY.summaryScore.value > 0.7,
			result.attributeScores.IDENTITY_ATTACK.summaryScore.value > 0.7,
			result.attributeScores.INSULT.summaryScore.value > 0.9,
			result.attributeScores.PROFANITY.summaryScore.value > 0.9,
			result.attributeScores.THREAT.summaryScore.value > 0.7,
		],
	};
}

export interface AnalyzeMessageResult {
	attributes: {
		TOXICITY: number;
		SEVERE_TOXICITY: number;
		IDENTITY_ATTACK: number;
		INSULT: number;
		PROFANITY: number;
		THREAT: number;
	};
	score: boolean[];
}
