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
	'Keep responses concise and under 1800 characters when possible.',
	'Use short paragraphs and bullet points for readability.',
	'When citing web sources, reference them inline with [n] markers — do not repeat full URLs in your response body.',
	'Limit sources to the most relevant (max 5).',
	'Reject offensive slurs and hateful content.',
].join(' ');

export type ModerationResult = OpenAI.Moderations.Moderation;

function formatResponseWithSources(text: string, sources: Awaited<ReturnType<typeof generateText>>['sources']): string {
	const result = text.trim();
	if (!sources.length) return result;
	const urlSources = sources.filter(s => s.sourceType === 'url');
	if (!urlSources.length) return result;
	const sourceList = urlSources.map((s, i) => `[${i + 1}] ${s.url}`).join('\n');
	return `${result}\n\nSources:\n${sourceList}`;
}

export async function sendMessage(prompt: string, userId: string, image: string | null, model = 'gpt-5.2') {
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
		text: prompt,
		voice: 'cedar',
		outputFormat: 'opus',
	});

	if (!audio) throw new Error('No response from TTS');
	return Readable.from(Buffer.from(audio.uint8Array));
}
