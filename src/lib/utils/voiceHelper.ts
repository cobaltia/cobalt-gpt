import { streamTSSReadable } from '#lib/gpt';
import {
	AudioPlayerStatus,
	StreamType,
	VoiceConnectionStatus,
	createAudioResource,
	entersState,
	joinVoiceChannel,
	type AudioPlayer,
} from '@discordjs/voice';
import { type VoiceBasedChannel } from 'discord.js';

export async function connectToChannel(channel: VoiceBasedChannel) {
	const connection = joinVoiceChannel({
		channelId: channel.id,
		guildId: channel.guild.id,
		adapterCreator: channel.guild.voiceAdapterCreator,
	});

	try {
		await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
		return connection;
	} catch (error) {
		connection.destroy();
		throw error;
	}
}

export async function playAudio(player: AudioPlayer, prompt: string, speaker: string) {
	const opusStream = await streamTSSReadable(prompt, speaker);

	const resource = createAudioResource(opusStream, {
		inputType: StreamType.OggOpus,
	});

	player.play(resource);

	return entersState(player, AudioPlayerStatus.Playing, 5_000);
}
