import { ChatGPTAPI } from 'chatgpt';

const api = new ChatGPTAPI({
	apiKey: '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',
	debug: true,
});

const res = await api.sendMessage('Can you tell me the history of WWII');
console.log(res.text);
