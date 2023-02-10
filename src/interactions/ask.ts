import { ApplicationCommandOptionType } from 'discord-api-types/v10';

export const askCommand = {
	name: 'ask',
	description: 'Ask a question to ChatGPT.',
	options: [
		{
			name: 'prompt',
			description: 'The prompt to ask ChatGPT.',
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
};
