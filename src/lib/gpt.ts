import { ChatGPTAPI } from 'chatgpt';
import { parseGptToken } from '#root/config';

export const api = new ChatGPTAPI({
	apiKey: parseGptToken().token,
	debug: true,
});
