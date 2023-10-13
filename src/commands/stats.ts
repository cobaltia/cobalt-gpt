import { DurationFormatter } from '@sapphire/duration';
import { EmbedBuilder, type ChatInputCommandInteraction } from 'discord.js';
import { getMostActiveUser, getOrCreateGuild, getOrCreateUser } from '#lib/database';
import { GenericCommand } from '#lib/structures';
import { ratelimit } from '#utils/cooldown';

const formatter = new DurationFormatter();

abstract class StatsCommand extends GenericCommand {
	public constructor() {
		super({
			name: 'stats',
			devOnly: false,
		});
	}

	public override async run(interaction: ChatInputCommandInteraction<'cached'>) {
		const commands = interaction.options.getSubcommand(true);
		if (ratelimit.limited) {
			return interaction.reply({
				content: `You have reached the global ratelimit. Try again in ${formatter.format(ratelimit.remainingTime)}.`,
				ephemeral: true,
			});
		}

		switch (commands) {
			case 'guild':
				return this.guild(interaction);
			case 'user':
				return this.user(interaction);
		}

		ratelimit.consume();
	}

	private async guild(interaction: ChatInputCommandInteraction<'cached'>) {
		const guild = await getOrCreateGuild(interaction.guildId);
		const user = await getMostActiveUser(interaction.guildId);
		const member = await interaction.guild.members.fetch(user.id);
		const embed = new EmbedBuilder()
			.setTitle('Guild Stats')
			.setAuthor({
				name: interaction.guild.name,
				iconURL: interaction.guild.iconURL() ?? undefined,
			})
			.setDescription(
				`**Total Prompts** - ${guild.totalRuns}\n**Total Successful Runs** - ${guild.numOfSuccessfulRuns}\n**Total Failed Runs** - ${guild.numOfFailedRuns}\n**Most Active User** - ${member.user.username} (${user.totalRuns})`,
			)
			.setTimestamp();
		return interaction.reply({ embeds: [embed] });
	}

	private async user(interaction: ChatInputCommandInteraction<'cached'>) {
		const userArg = interaction.options.getUser('user', false);
		const user = await getOrCreateUser((userArg ?? interaction.user).id, interaction.guildId);
		const embed = new EmbedBuilder()
			.setTitle(`${(userArg ?? interaction.user).username}'s Stats`)
			.setAuthor({
				name: (userArg ?? interaction.user).username,
				iconURL: (userArg ?? interaction.user).avatarURL() ?? undefined,
			})
			.setDescription(
				`**Total Prompts** - ${user.totalRuns}\n**Total Successful Runs** - ${user.numOfSuccessfulRuns}\n**Total Failed Runs** - ${user.numOfFailedRuns}`,
			)
			.setTimestamp();
		return interaction.reply({ embeds: [embed] });
	}
}

export default StatsCommand;
