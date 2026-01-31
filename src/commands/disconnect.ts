import { Command } from '@sapphire/framework';
import { getVoiceConnection } from '@discordjs/voice';
import { GuildMember } from 'discord.js';

export class DisconnectCommand extends Command {
	public constructor(context: Command.LoaderContext, options: Command.Options) {
		super(context, {
			...options,
			description: 'Disconnect the bot from the voice channel.',
			preconditions: ['CobaltOnly'],
		});
	}

	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(builder => builder.setName(this.name).setDescription(this.description));
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		if (!interaction.inGuild()) {
			await interaction.reply({
				content: 'This command can only be used inside a server.',
				ephemeral: true,
			});
			return;
		}

		await interaction.deferReply({ ephemeral: true });

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

		const connection = getVoiceConnection(guild.id);

		if (!connection) {
			await interaction.editReply({
				content: 'I am not connected to a voice channel in this server.',
			});
			return;
		}

		const botChannelId = connection.joinConfig.channelId;
		const memberChannelId = member.voice.channelId;

		if (botChannelId && memberChannelId && botChannelId !== memberChannelId) {
			await interaction.editReply({
				content: 'You must be in the same voice channel as me to disconnect the bot.',
			});
			return;
		}

		try {
			connection.destroy();
			this.container.player.stop(true);
			await interaction.editReply({
				content: 'Disconnected from the voice channel.',
			});
			logger.info(`Disconnected from voice channel ${botChannelId ?? 'unknown'} in guild ${guild.id}`);
		} catch (error) {
			const err = error as Error;
			logger.error(`Failed to disconnect from the voice channel in guild ${guild.id}: ${err.message}`);
			await interaction.editReply({
				content: 'Failed to disconnect from the voice channel. Please try again later.',
			});
		}
	}
}
