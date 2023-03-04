import { DurationFormatter } from '@sapphire/duration';
import { EmbedBuilder, type Interaction, WebhookClient } from 'discord.js';
import type { CreateModerationResponseResultsInner } from 'openai';
import { Events } from '../lib/types/Events.js';
import { moderation, sendMessage } from '#lib/gpt';
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
				const analyzes = await moderation(prompt);
				await this.logPrompt(prompt, analyzes, interaction).catch(console.error);
				if (analyzes[0].flagged) {
					await interaction.editReply({
						content: 'Your prompt was flagged as potentially offensive. Please try again with a different prompt.',
					});
					return;
				}

				const res = await sendMessage(prompt);
				await interaction.editReply(truncate(res.content, 2_000));
				ratelimit.consume();
			} catch (error) {
				await interaction.editReply({ content: 'An error occurred while processing your request.' });
				console.error(error);
			}
		}
	}

	private async logPrompt(
		prompt: string,
		analyze: CreateModerationResponseResultsInner[],
		interaction: Interaction<'cached'>,
	) {
		const webhook = new WebhookClient({ url: webhooks.prompt });
		const embed = new EmbedBuilder()
			.setTitle('Prompt')
			.setAuthor({ name: interaction.member.user.tag, iconURL: interaction.member.user.displayAvatarURL() })
			.setDescription(prompt)
			.addFields({
				name: 'Attributes',
				value: this.formatAttributes(analyze),
			})
			.setColor(analyze[0].flagged ? 'Red' : 'Green')
			.setFooter({ text: interaction.guildId, iconURL: interaction.guild.iconURL() ?? undefined })
			.setTimestamp();
		await webhook.send({ embeds: [embed] });
	}

	private formatAttributes(analyze: CreateModerationResponseResultsInner[]) {
		return Object.entries(analyze[0].category_scores)
			.map(
				([key, value]) =>
					`**${key}:** ${value} ${Object.getOwnPropertyDescriptor(analyze[0].categories, key)?.value ? '•' : ''}`,
			)
			.join('\n');
	}
}

export default InteractionCreateListener;
