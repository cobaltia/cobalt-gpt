import type { Interaction } from 'discord.js';
import { Events } from '../lib/types/Events';
import { Listener } from '#lib/structures';

abstract class InteractionCreateListener extends Listener<typeof Events.InteractionCreate> {
	public constructor() {
		super({
			name: Events.InteractionCreate,
		});
	}

	public async run(interaction: Interaction<'cached'>) {
		console.log(`${interaction.member.user.tag} triggered ${this.name}`);
		if (!interaction.isChatInputCommand()) return;
		if (interaction.commandName === 'ask') {
			await interaction.reply('pong!');
		}
	}
}

export default InteractionCreateListener;
