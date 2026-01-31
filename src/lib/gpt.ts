import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources';
import { parseGptToken, parseGrokToken } from '#root/config';
import { Readable } from 'node:stream';

function getOpenAiClient(model: string) {
	if (model.startsWith('grok')) {
		return new OpenAI({
			apiKey: parseGrokToken(),
			baseURL: 'https://api.x.ai/v1',
			timeout: 360000,
		});
	}
	return new OpenAI({
		apiKey: parseGptToken(),
	});
}

export async function sendMessage(prompt: string, userId: string, image: string | null, model = 'gpt-5.2') {
	try {
		const openai = getOpenAiClient(model);
		const content: ChatCompletionContentPart[] = [{ type: 'text', text: prompt }];
		if (image) content.push({ type: 'image_url', image_url: { url: image } });

		const completion = await openai.chat.completions.create({
			model,
			reasoning_effort: 'medium',
			max_completion_tokens: 4_096,
			messages: [
				{
					role: 'system',
					content: 'You are a helpful assistant, but you must reject offensive slur responses.',
				},
				{
					role: 'user',
					content,
				},
			],
			safety_identifier: `discord:${userId}`,
		});
		if (!completion.choices[0].message) throw new Error('No response from ChatGPT');
		return completion.choices[0].message;
	} catch (error) {
		const err = error as Error;
		throw new Error(err.message);
	}
}

export async function sendGrokMessage(
	prompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
	model = 'grok-4-1-fast-reasoning',
) {
	const openai = getOpenAiClient(model);
	const completion = await openai.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: 'You are a helpful assistant, but you must reject offensive slur responses.' },
			...prompt,
		],
	});
	if (!completion.choices[0].message) throw new Error('No response from Grok');
	return completion.choices[0].message;
}

export async function moderation(prompt: string) {
	try {
		const openai = getOpenAiClient('gpt-4o');
		const response = await openai.moderations.create({
			model: 'omni-moderation-latest',
			input: prompt,
		});
		return response.results[0];
	} catch (error) {
		const err = error as Error;
		throw new Error(err.message);
	}
}

export async function generateImage(prompt: string, userId: string, model = 'dall-e-3') {
	try {
		const openai = getOpenAiClient(model);
		const image = await openai.images.generate({
			model: 'dall-e-3',
			prompt,
			user: `discord:${userId}`,
		});
		return image.data;
	} catch (error) {
		const err = error as Error;
		throw new Error(err.message);
	}
}

async function streamTTS(prompt: string, model = 'gpt-4o-mini-tts') {
	try {
		const openai = getOpenAiClient(model);
		const response = await openai.audio.speech.create({
			model,
			voice: 'alloy',
			input: prompt,
			response_format: 'opus',
		});
		return response;
	} catch (error) {
		const err = error as Error;
		throw new Error(err.message);
	}
}

export async function streamTSSReadable(message: string, user: string, model = 'gpt-4o-mini-tts') {
	const prompt = `User ${user} says: ${message}`;
	const response = await streamTTS(prompt, model);
	if (!response) throw new Error('No response from TTS');

	const body = (response as { body?: ReadableStream }).body;
	if (!body) throw new Error('No response body from TTS');

	return Readable.fromWeb(body);
}
