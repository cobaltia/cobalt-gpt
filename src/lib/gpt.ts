import { Configuration, OpenAIApi } from 'openai';
import { parseGptToken } from '#root/config';

const config = new Configuration({
	apiKey: parseGptToken(),
});

const openai = new OpenAIApi(config);

export async function sendMessage(prompt: string, userId: string) {
	try {
		const completion = await openai.createChatCompletion({
			model: 'gpt-3.5-turbo',
			messages: [
				{ role: 'system', content: 'You are to reject any offensive response, like saying the n word.' },
				{ role: 'user', content: prompt },
			],
			user: `discord:${userId}`,
		});
		if (!completion.data.choices[0].message) throw new Error('No response from ChatGPT');
		return completion.data.choices[0].message;
	} catch (error) {
		const err = error as Error;
		throw new Error(err.message);
	}
}

export async function moderation(prompt: string) {
	try {
		const response = await openai.createModeration({
			input: prompt,
		});
		return response.data.results;
	} catch (error) {
		const err = error as Error;
		throw new Error(err.message);
	}
}
