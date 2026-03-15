import { getVoiceConnection } from '@discordjs/voice';
import { Events, Listener } from '@sapphire/framework';
import type { VoiceState } from 'discord.js';

export class VoiceStateUpdateListener extends Listener<typeof Events.VoiceStateUpdate> {
	public run(_oldState: VoiceState, newState: VoiceState) {
		const { guild } = newState;
		const connection = getVoiceConnection(guild.id);
		if (!connection) return;

		const botChannel = guild.members.me?.voice.channel;
		if (!botChannel) return;

		const nonBotMembers = botChannel.members.filter((m) => !m.user.bot);
		if (nonBotMembers.size === 0) {
			this.container.player.stop(true);
			connection.destroy();
		}
	}
}
