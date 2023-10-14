import OpenAI, { type ClientOptions } from 'openai';
import { parseGptToken } from '#root/config';

const config: ClientOptions = {
	apiKey: parseGptToken(),
};

const openai = new OpenAI(config);

export async function sendMessage(prompt: string, userId: string) {
	try {
		const completion = await openai.chat.completions.create({
			model: 'gpt-4',
			messages: [
				{
					role: 'system',
					content: 'You are a helpful assistant, but you must reject offensive slur responses. ',
				},
				{ role: 'user', content: prompt },
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
		const response = await openai.moderations.create({
			input: prompt,
		});
		return response.results[0];
	} catch (error) {
		const err = error as Error;
		throw new Error(err.message);
	}
}

export async function generateImage(prompt: string, userId: string) {
	try {
		const image = await openai.images.generate({ prompt, user: `discord:${userId}` });
		return image.data;
	} catch (error) {
		const err = error as Error;
		throw new Error(err.message);
	}
}
