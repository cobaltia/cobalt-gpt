import { Buffer } from 'node:buffer';
import { DurationFormatter } from '@sapphire/duration';
import { EmbedBuilder, type Interaction, WebhookClient, AttachmentBuilder } from 'discord.js';
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

				const res = await sendMessage(prompt, interaction.member.user.id);
				if (res.content.length > 2_000) {
					const attachment = new AttachmentBuilder(Buffer.from(res.content.trim())).setName('response.txt');
					await interaction.editReply({
						content: 'Your response was too long to be sent in a message. Here is a file instead.',
						files: [attachment],
					});
				} else {
					await interaction.editReply(truncate(res.content.trim(), 2_000));
				}

				ratelimit.consume();
			} catch (error) {
				try {
					console.error(error);
					if (!interaction.deferred && !interaction.replied) await interaction.deferReply();
					await interaction.editReply({ content: 'An error occurred while processing your request.', components: [] });
				} catch (error) {
					const err = error as Error;
					throw new Error(err.message);
				}
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
