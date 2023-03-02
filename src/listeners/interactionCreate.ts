import { DurationFormatter } from '@sapphire/duration';
import { EmbedBuilder, type Interaction, WebhookClient } from 'discord.js';
import { Events } from '../lib/types/Events.js';
import { sendMessage } from '#lib/gpt';
import { analyzeMessage } from '#lib/perspective';
import { Listener } from '#lib/structures';
import { parseWebhooks } from '#root/config';
import { ratelimit } from '#utils/cooldown';
import { truncate } from '#utils/utils';

const webhooks = parseWebhooks();

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
		if (interaction.commandName === 'ask') {
			if (ratelimit.limited) {
				await interaction.reply({
					content: `You have reached the global ratelimit. Try again in ${formatter.format(ratelimit.remainingTime)}.`,
					ephemeral: true,
				});
				return;
			}

			try {
				await interaction.deferReply();
				const prompt = interaction.options.getString('prompt', true);
				await this.logPrompt(prompt, interaction).catch(console.error);
				if (await analyzeMessage(prompt)) {
					await interaction.editReply('Your message was flagged as toxic. Please try again.');
					return;
				}

				const res = await sendMessage(prompt);
				await interaction.editReply(truncate(res.content, 2_000));
				ratelimit.consume();
			} catch (error) {
				await interaction.editReply('An error occurred while processing your request.');
				console.error(error);
			}
		}
	}

	private async logPrompt(prompt: string, interaction: Interaction<'cached'>) {
		const webhook = new WebhookClient({ url: webhooks.prompt });
		const embed = new EmbedBuilder()
			.setTitle('Prompt')
			.setAuthor({ name: interaction.member.user.tag, iconURL: interaction.member.user.displayAvatarURL() })
			.setDescription(prompt)
			.setFooter({ text: interaction.guildId, iconURL: interaction.guild.iconURL() ?? undefined })
			.setTimestamp();
		await webhook.send({ embeds: [embed] });
	}
}

export default InteractionCreateListener;
