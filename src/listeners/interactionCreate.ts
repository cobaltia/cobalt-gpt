import { type Interaction } from 'discord.js';
import { Events } from '../lib/types/Events.js';
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
		} catch (error) {
			try {
				console.error(error);
				if (!interaction.deferred && !interaction.replied) await interaction.deferReply();
				// @ts-expect-error: unknown error type
				if (error?.message.includes('Your request was rejected as a result of our safety system.')) {
					await interaction.editReply({
						content: 'Your prompt was flagged as potentially offensive. Please try again with a different prompt.',
					});
					// @ts-expect-error: unknown error type
				} else if (error?.message.includes('You exceeded your current quota')) {
					await interaction.editReply({
						content:
							'Max quota reached. Please try again later. Help alleviate the cost by donating [here](https://github.com/sponsors/JuanPablo2655)',
					});
				} else {
					await interaction.editReply({
						content: 'An error occurred while processing your request.',
						components: [],
					});
				}
			} catch (error) {
				const err = error as Error;
				throw new Error(err.message);
			}
		}
	}
}

export default InteractionCreateListener;
