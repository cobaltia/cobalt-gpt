import { Buffer } from 'node:buffer';
import { DurationFormatter } from '@sapphire/duration';
import {
	WebhookClient,
	type ChatInputCommandInteraction,
	type Interaction,
	EmbedBuilder,
	AttachmentBuilder,
} from 'discord.js';
import type Moderation from 'openai';
import { updateInfractions } from '#lib/database';
import { moderation, sendMessage } from '#lib/gpt';
import { GenericCommand } from '#lib/structures';
import { parseWebhooks } from '#root/config';
import { ratelimit } from '#utils/cooldown';
import { truncate } from '#utils/utils';

const webhooks = parseWebhooks();
const formatter = new DurationFormatter();
const imageFormats = ['png', 'jpeg', 'gif', 'webp'];

abstract class AskCommand extends GenericCommand {
	public constructor() {
		super({
			name: 'ask',
			devOnly: false,
		});
	}

	public override async run(interaction: ChatInputCommandInteraction<'cached'>) {
		if (ratelimit.limited) {
			return interaction.reply({
				content: `You have reached the global ratelimit. Try again in ${formatter.format(ratelimit.remainingTime)}.`,
				ephemeral: true,
			});
		}

		await interaction.deferReply();
		const prompt = interaction.options.getString('prompt', true);
		const image = interaction.options.getAttachment('image');
		if (!imageFormats.includes(image?.contentType?.split('/')[1].split(';')[0] ?? '')) {
			await interaction.editReply({ content: 'Invalid image format. Please try again with a different image.' });
			return;
		}

		const analyzes = await moderation(prompt);
		await this.logPrompt(prompt, analyzes, interaction).catch(console.error);
		if (analyzes.flagged) {
			await interaction.editReply({
				content: 'Your prompt was flagged as potentially offensive. Please try again with a different prompt.',
			});
			await updateInfractions(interaction.member.user.id, interaction.guildId);
			return;
		}

		const res = await sendMessage(prompt, interaction.member.user.id, image?.url ?? null);
		if (!res.content) throw new Error('No response from ChatGPT');
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
	}

	private async logPrompt(
		prompt: string,
		analyze: Moderation.Moderations.Moderation,
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
			.setColor(analyze.flagged ? 'Red' : 'Green')
			.setFooter({ text: interaction.guildId, iconURL: interaction.guild.iconURL() ?? undefined })
			.setTimestamp();
		await webhook.send({ embeds: [embed] });
	}

	private formatAttributes(analyze: Moderation.Moderations.Moderation) {
		return Object.entries(analyze.category_scores)
			.map(
				([key, _]) =>
					`**${key}:** ${Object.getOwnPropertyDescriptor(analyze.categories, key)?.value ? 'Fail' : 'Pass'}`,
			)
			.join('\n');
	}
}

export default AskCommand;
