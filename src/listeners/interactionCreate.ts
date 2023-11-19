import { type Interaction } from 'discord.js';
import { Events } from '../lib/types/Events.js';
import {
	getOrCreateGuild,
	getOrCreateUser,
	updateFailedRuns,
	updateGuild,
	updateInfractions,
	updateSuccessfulRuns,
	updateUser,
} from '#lib/database';
import { Listener, container } from '#lib/structures';

const { commands } = container;

abstract class InteractionCreateListener extends Listener<typeof Events.InteractionCreate> {
	public constructor() {
		super({
			name: Events.InteractionCreate,
		});
	}

	public async run(interaction: Interaction<'cached'>) {
		if (!interaction.isChatInputCommand()) return;
		const command = commands.get(interaction.commandName);
		if (!command) return;
		try {
			console.log(`${interaction.member.user.username} triggered ${command.name}`);
			await command.run(interaction);
			if (['ask', 'generate'].includes(command.name))
				await updateSuccessfulRuns(interaction.user.id, interaction.guildId);
			if (command.name === 'generate') {
				const user = await getOrCreateUser(interaction.user.id, interaction.guildId);
				const guild = await getOrCreateGuild(interaction.guildId);
				await updateUser(interaction.user.id, interaction.guildId, {
					imagesGenerated: user.imagesGenerated + 1,
				});
				await updateGuild(interaction.guildId, {
					imagesGenerated: guild.imagesGenerated + 1,
				});
			}
		} catch (error) {
			try {
				console.error(error);
				if (!interaction.deferred && !interaction.replied) await interaction.deferReply();
				// @ts-expect-error: unknown error type
				if (error?.message.includes('Your request was rejected as a result of our safety system.')) {
					await interaction.editReply({
						content: 'Your prompt was flagged as potentially offensive. Please try again with a different prompt.',
					});
					await updateInfractions(interaction.member.user.id, interaction.guildId);
					return;
				} else {
					await interaction.editReply({ content: 'An error occurred while processing your request.', components: [] });
				}

				if (['ask', 'generate'].includes(command.name))
					await updateFailedRuns(interaction.user.id, interaction.guildId);
			} catch (error) {
				const err = error as Error;
				throw new Error(err.message);
			}
		}
	}
}

export default InteractionCreateListener;
