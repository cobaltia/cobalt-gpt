import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '#lib/BotClient';

export abstract class GenericCommand {
	public name: string;

	public devOnly: boolean;

	public abstract bot: BotClient;

	public constructor(options: CommandOptions) {
		this.name = options.name;
		this.devOnly = options.devOnly ?? false;
	}

	public abstract run(interaction: ChatInputCommandInteraction<'cached'>): Promise<unknown> | unknown;
}

interface CommandOptions {
	name: string;
	devOnly?: boolean;
}
