import { DurationFormatter, Time } from '@sapphire/duration';
import { RateLimitManager } from '@sapphire/ratelimits';
import type { Interaction } from 'discord.js';
import { Events } from '../lib/types/Events.js';
import { api } from '#lib/gpt';
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
		const formatter = new DurationFormatter();
		const rateLimitManager = new RateLimitManager(Time.Hour, 50);
		const ratelimit = rateLimitManager.acquire('global');
		if (interaction.commandName === 'ask') {
			if (ratelimit.limited) {
				await interaction.reply({
					content: `You have reached the global ratelimit. Try again in ${formatter.format(ratelimit.remainingTime)}`,
					ephemeral: true,
				});
				return;
			}

			try {
				await interaction.deferReply();
				const prompt = interaction.options.getString('prompt', true);
				const res = await api.sendMessage(prompt);
				await interaction.editReply(res.text);
				ratelimit.consume();
			} catch (error) {
				await interaction.editReply('An error occurred while processing your request.');
				console.error(error);
			}
		}
	}
}

export default InteractionCreateListener;
