import { createAudioPlayer, type AudioPlayer } from '@discordjs/voice';
import { container } from '@sapphire/framework';

container.player = createAudioPlayer();

declare module '@sapphire/framework' {
	interface Container {
		player: AudioPlayer;
	}
}
