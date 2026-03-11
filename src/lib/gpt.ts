import { createOpenAI } from '@ai-sdk/openai';
import { createXai } from '@ai-sdk/xai';
import {
	generateImage as aiGenerateImage,
	experimental_generateSpeech as generateSpeech,
	generateText,
	type ModelMessage,
	type UserContent,
} from 'ai';
import OpenAI from 'openai';
import { parseGptToken, parseGrokToken } from '#root/config';
import { Readable } from 'node:stream';

const openai = createOpenAI({ apiKey: parseGptToken() });
const xai = createXai({ apiKey: parseGrokToken() });

const SYSTEM_PROMPT = [
	'You are a helpful assistant in a Discord server.',
	'Default to concise answers: 1-4 short paragraphs or 3-6 bullet points.',
	'Target under 1200 characters; never exceed 1800 unless the user explicitly asks for depth.',
	'Use plain language, short sentences, and practical next steps.',
	'If the request is ambiguous, ask one clarifying question before giving a long answer.',
	'If you are uncertain, say so briefly and provide the best supported answer.',
	'Use web search only when freshness or factual verification is needed; otherwise answer directly.',
	'When citing web sources, use inline [n] markers only for claims that need evidence.',
	'Keep citations minimal and relevant (max 5).',
	'Do not include full URLs in the body; they are appended separately.',
	'Refuse or safely redirect harmful content, including hate/harassment, sexual content involving minors, self-harm encouragement, and illegal violent wrongdoing.',
	'Be polite, non-judgmental, and avoid inflammatory language.',
].join(' ');

export type ModerationResult = OpenAI.Moderations.Moderation;

function formatResponseWithSources(
	text: string,
	_sources: Awaited<ReturnType<typeof generateText>>['sources'],
): string {
	let result = text.trim();
	result = result = result.replace(/(?<!<)(https?:\/\/[^\s)>\]]+)(?!>)/gi, '<$1>');
	return result;
}

export async function sendMessage(prompt: string, userId: string, image: string | null, model = 'gpt-5.4') {
	const userContent: UserContent = [{ type: 'text', text: prompt }];
	if (image) userContent.push({ type: 'file', data: new URL(image), mediaType: 'image/*' });

	const { text, sources } = await generateText({
		model: openai.responses(model),
		system: SYSTEM_PROMPT,
		messages: [{ role: 'user', content: userContent }],
		tools: {
			web_search: openai.tools.webSearch(),
		},
		providerOptions: {
			openai: {
				reasoningEffort: 'medium',
				maxCompletionTokens: 4_096,
				safetyIdentifier: `discord:${userId}`,
			},
		},
	});

	if (!text) throw new Error('No response from ChatGPT');
	return formatResponseWithSources(text, sources);
}

export async function sendGrokMessage(prompt: ModelMessage[], model = 'grok-4-1-fast-reasoning') {
	const { text, sources } = await generateText({
		model: xai.responses(model),
		system: SYSTEM_PROMPT,
		messages: prompt,
		tools: {
			web_search: xai.tools.webSearch(),
			x_search: xai.tools.xSearch(),
		},
	});

	if (!text) throw new Error('No response from Grok');
	return formatResponseWithSources(text, sources);
}

export async function moderation(prompt: string) {
	const client = new OpenAI({ apiKey: parseGptToken() });
	const response = await client.moderations.create({
		model: 'omni-moderation-latest',
		input: prompt,
	});
	return response.results[0];
}

export async function generateImage(prompt: string, userId: string) {
	const { image } = await aiGenerateImage({
		model: openai.image('gpt-image-1.5'),
		prompt,
		providerOptions: {
			openai: {
				user: `discord:${userId}`,
			},
		},
	});

	return image;
}

export async function streamTSSReadable(message: string, user: string, model = 'gpt-4o-mini-tts') {
	const prompt = `User ${user} says: ${message}`;
	const { audio } = await generateSpeech({
		model: openai.speech(model),
		instructions:
			'Speak naturally, warm and conversational. Use subtle pauses and expressive intonation to make the speech engaging. Avoid sounding robotic.',
		text: prompt,
		voice: 'cedar',
		outputFormat: 'opus',
	});

	if (!audio) throw new Error('No response from TTS');
	return Readable.from(Buffer.from(audio.uint8Array));
}
