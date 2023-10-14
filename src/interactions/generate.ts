import { ApplicationCommandOptionType } from 'discord-api-types/v10';

export const generateCommand = {
	name: 'generate',
	description: 'Generate an image.',
	options: [
		{
			type: ApplicationCommandOptionType.String,
			name: 'prompt',
			description: 'The image prompt.',
			required: true,
		},
	],
};
