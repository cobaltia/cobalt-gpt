import { ApplicationCommandOptionType } from 'discord-api-types/v10';

export const statsCommand = {
	name: 'stats',
	description: 'get statistical data',
	options: [
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'guild',
			description: 'get guild stats',
		},
		{
			type: ApplicationCommandOptionType.Subcommand,
			name: 'user',
			description: 'get user stats',
			options: [
				{
					type: ApplicationCommandOptionType.User,
					name: 'user',
					description: 'the user',
				},
			],
		},
	],
};
