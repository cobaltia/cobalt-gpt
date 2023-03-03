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
	const TOXICITY = result.attributeScores.TOXICITY.summaryScore.value;
	const SEVERE_TOXICITY = result.attributeScores.SEVERE_TOXICITY.summaryScore.value;
	const IDENTITY_ATTACK = result.attributeScores.IDENTITY_ATTACK.summaryScore.value;
	const INSULT = result.attributeScores.INSULT.summaryScore.value;
	const PROFANITY = result.attributeScores.PROFANITY.summaryScore.value;
	const THREAT = result.attributeScores.THREAT.summaryScore.value;
	const weight = {
		TOXICITY: 0.9,
		SEVERE_TOXICITY: 0.7,
		IDENTITY_ATTACK: 0.7,
		INSULT: 0.9,
		PROFANITY: 0.9,
		THREAT: 0.7,
	};
	return {
		attributes: {
			TOXICITY: `${TOXICITY} ${TOXICITY > weight.TOXICITY ? '•' : ''}`,
			SEVERE_TOXICITY: `${SEVERE_TOXICITY} ${SEVERE_TOXICITY > weight.SEVERE_TOXICITY ? '•' : ''}`,
			IDENTITY_ATTACK: `${IDENTITY_ATTACK} ${IDENTITY_ATTACK > weight.IDENTITY_ATTACK ? '•' : ''}`,
			INSULT: `${INSULT} ${INSULT > weight.INSULT ? '•' : ''}`,
			PROFANITY: `${PROFANITY} ${PROFANITY > weight.PROFANITY ? '•' : ''}`,
			THREAT: `${THREAT} ${THREAT > weight.THREAT ? '•' : ''}`,
		},
		score: [
			TOXICITY > weight.TOXICITY,
			SEVERE_TOXICITY > weight.SEVERE_TOXICITY,
			IDENTITY_ATTACK > weight.IDENTITY_ATTACK,
			INSULT > weight.INSULT,
			PROFANITY > weight.PROFANITY,
			THREAT > weight.THREAT,
		],
	};
}

export interface AnalyzeMessageResult {
	attributes: {
		TOXICITY: string;
		SEVERE_TOXICITY: string;
		IDENTITY_ATTACK: string;
		INSULT: string;
		PROFANITY: string;
		THREAT: string;
	};
	score: boolean[];
}
