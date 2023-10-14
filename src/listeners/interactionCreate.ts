import { type Interaction } from 'discord.js';
import { Events } from '../lib/types/Events.js';
import { updateFailedRuns, updateSuccessfulRuns } from '#lib/database';
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
			if (['ask'].includes(command.name)) await updateSuccessfulRuns(interaction.user.id, interaction.guildId);
		} catch (error) {
			try {
				console.error(error);
				if (!interaction.deferred && !interaction.replied) await interaction.deferReply();
				await interaction.editReply({ content: 'An error occurred while processing your request.', components: [] });
				if (['ask'].includes(command.name)) await updateFailedRuns(interaction.user.id, interaction.guildId);
			} catch (error) {
				const err = error as Error;
				throw new Error(err.message);
			}
		}
	}
}

export default InteractionCreateListener;
