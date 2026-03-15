import { connectToChannel, playAudio } from '#utils/voiceHelper';
import { Command } from '@sapphire/framework';
import { GuildMember, MessageFlags } from 'discord.js';

export class SpeakCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Make the bot speak in a voice channel.',
			preconditions: ['CobaltOnly'],
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.addStringOption(option =>
					option.setName('text').setDescription('The text for the bot to speak.').setRequired(true),
				)
				.addStringOption(option =>
					option
						.setName('instructions')
						.setDescription('Additional instructions for the bot to speak.')
						.setRequired(false),
				),
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({
				content: 'This command can only be used inside a server.',
				flags: MessageFlags.Ephemeral,
			});
			return;
		}

		await interaction.deferReply();

		const instructions = interaction.options.getString('instructions', false) ?? undefined;
		const rawText = interaction.options.getString('text', true);
		const text = rawText.trim();
		if (!text.length) {
			await interaction.editReply({ content: 'Please provide some text for the bot to speak.' });
			return;
		}

		const logger = this.container.logger;
		const guild = interaction.guild!;

		let member: GuildMember | null = null;

		if (interaction.member instanceof GuildMember) {
			member = interaction.member;
		} else {
			try {
				member = await guild.members.fetch(interaction.user.id);
			} catch {
				member = null;
			}
		}

		if (!member) {
			await interaction.editReply({
				content: 'Unable to resolve your user information. Please try again.',
			});
			return;
		}

		if (member.roles.cache.has('1467592336476475577')) {
			await interaction.editReply({ content: 'You are not allowed to use this command.' });
			return;
		}

		const voiceChannel = member.voice.channel;
		if (!voiceChannel) {
			await interaction.editReply({ content: 'You must be in a voice channel to use this command.' });
			return;
		}

		try {
			const connection = await connectToChannel(voiceChannel);
			connection.subscribe(this.container.player);
			await playAudio(this.container.player, text, member.displayName ?? member.user.username, instructions);
			const content = [`The bot is speaking in ${voiceChannel.name}.`, `Text: ${text}`].join('\n');
			await interaction.editReply({ content });
		} catch (error) {
			const err = error as Error;
			logger.error(`Failed to make the bot speak: ${err.message}`);
			await interaction.editReply({ content: 'Failed to make the bot speak.' });
		}
	}
}
