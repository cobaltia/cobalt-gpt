import { Buffer } from 'node:buffer';
import { WebhookClient, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import type Moderation from 'openai';
import { moderation, sendMessage } from '#lib/gpt';
import { parseWebhooks } from '#root/config';
import { truncate } from '#utils/utils';
import { BucketScope, Command } from '@sapphire/framework';

const webhooks = parseWebhooks();
const imageFormats = ['png', 'jpeg', 'gif', 'webp'];

export class AskCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Ask a question to ChatGPT.',
			cooldownLimit: 50,
			cooldownScope: BucketScope.Global,
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option.setName('prompt').setDescription('The prompt to ask ChatGPT.').setRequired(true),
				)
				.addAttachmentOption(option => option.setName('image').setDescription('The image to use as context.')),
		);
	}

	public async run(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const prompt = interaction.options.getString('prompt', true);
		const image = interaction.options.getAttachment('image');
		if (image && !imageFormats.includes(image.contentType?.split('/')[1].split(';')[0] ?? '')) {
			await interaction.editReply({ content: 'Invalid image format. Please try again with a different image.' });
			return;
		}

		const analyzes = await moderation(prompt);
		await this.logPrompt(prompt, analyzes, interaction).catch(console.error);
		if (analyzes.flagged) {
			await interaction.editReply({
				content: 'Your prompt was flagged as potentially offensive. Please try again with a different prompt.',
			});
			return;
		}

		const res = await sendMessage(prompt, interaction.member!.user.id, image?.url ?? null);
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
	}

	private async logPrompt(
		prompt: string,
		analyze: Moderation.Moderations.Moderation,
		interaction: Command.ChatInputCommandInteraction,
	) {
		const webhook = new WebhookClient({ url: webhooks.prompt });
		const embed = new EmbedBuilder()
			.setTitle('Prompt')
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
			.setDescription(prompt)
			.addFields({
				name: 'Attributes',
				value: this.formatAttributes(analyze),
			})
			.setColor(analyze.flagged ? 'Red' : 'Green')
			.setFooter({ text: interaction.guildId!, iconURL: interaction.guild!.iconURL() ?? undefined })
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
