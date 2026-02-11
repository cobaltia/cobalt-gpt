import { WebhookClient, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { generateImage, moderation, type ModerationResult } from '#lib/gpt';
import { parseWebhooks } from '#root/config';
import { Command } from '@sapphire/framework';

const webhooks = parseWebhooks();

export class GenerateCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Generate an image with DALL·E.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option.setName('prompt').setDescription('The prompt to generate an image.').setRequired(true),
				),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();
		const prompt = interaction.options.getString('prompt', true);
		const analyzes = await moderation(prompt);
		await this.logPrompt(prompt, analyzes, interaction).catch(console.error);
		if (analyzes.flagged) {
			await interaction.editReply({
				content: 'Your prompt was flagged as potentially offensive. Please try again with a different prompt.',
			});
			return;
		}

		const image = await generateImage(prompt, interaction.user.id);
		if (!image) throw new Error('No response from DALL·E');
		const attachment = new AttachmentBuilder(Buffer.from(image.uint8Array)).setName('image.png');
		await interaction.editReply({ files: [attachment] });
	}

	private async logPrompt(prompt: string, analyze: ModerationResult, interaction: Command.ChatInputCommandInteraction) {
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

	private formatAttributes(analyze: ModerationResult) {
		return Object.entries(analyze.category_scores)
			.map(
				([key, _]) =>
					`**${key}:** ${Object.getOwnPropertyDescriptor(analyze.categories, key)?.value ? 'Fail' : 'Pass'}`,
			)
			.join('\n');
	}
}
