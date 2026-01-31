import { connectToChannel } from '#utils/voiceHelper';
import { Command } from '@sapphire/framework';
import { GuildMember } from 'discord.js';

export class JoinCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Prompt the bot to join a voice channel.',
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({ content: 'This command can only be used inside a server.', ephemeral: true });
			return;
		}

		const logger = this.container.logger;
		const guild = interaction.guild!;

		await interaction.deferReply({ ephemeral: true });

		let member: GuildMember | null = null;

		if (interaction.member instanceof GuildMember) {
			member = interaction.member;
		} else {
			try {
				member = await guild.members.fetch(interaction.user.id);
			} catch (error) {
				const err = error as Error;
				logger.warn(`Failed to fetch guild member ${interaction.user.id} in ${guild.id}: ${err.message}`);
			}
		}

		if (!member) {
			await interaction.editReply({
				content: 'Unable to resolve your guild member information. Please try again in a moment.',
			});
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
			await interaction.editReply({ content: `Joined voice channel: ${voiceChannel.name}` });
			logger.info(`Joined ${voiceChannel.name} in guild ${guild.id}`);
		} catch (error) {
			const err = error as Error;
			logger.error(`Failed to join voice channel ${voiceChannel.name} in guild ${guild.id}: ${err.message}`);
			await interaction.editReply({ content: 'Failed to join the voice channel. Please try again later.' });
		}
	}
}
