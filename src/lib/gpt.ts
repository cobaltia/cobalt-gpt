import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources';
import { parseGptToken } from '#root/config';

function getOpenAiClient(model: string) {
	if (model.startsWith('grok')) {
		return new OpenAI({
			apiKey: 'test',
			baseURL: 'https://api.x.ai/v1',
		});
	}
	return new OpenAI({
		apiKey: parseGptToken(),
	});
}

export async function sendMessage(prompt: string, userId: string, image: string | null, model = 'gpt-4o') {
	try {
		const openai = getOpenAiClient(model);
		const content: ChatCompletionContentPart[] = [{ type: 'text', text: prompt }];
		if (image) content.push({ type: 'image_url', image_url: { url: image } });

		const completion = await openai.chat.completions.create({
			model: 'gpt-4o',
			max_tokens: 4_096,
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
			user: `discord:${userId}`,
		});
		if (!completion.choices[0].message) throw new Error('No response from ChatGPT');
		return completion.choices[0].message;
	} catch (error) {
		const err = error as Error;
		throw new Error(err.message);
	}
}

export async function moderation(prompt: string) {
	try {
		const openai = getOpenAiClient('gpt-4o');
		const response = await openai.moderations.create({
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
