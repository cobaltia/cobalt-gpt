import type { ClientEvents } from 'discord.js';
import type { BotClient } from '#lib/BotClient';

export abstract class Listener<T extends keyof ClientEvents = ''> {
	public name: T;

	public once: boolean;

	public abstract bot: BotClient;

	public constructor(options: ListenerOptions<T>) {
		this.name = options.name;
		this.once = options.once ?? false;
	}

	public abstract run(...args: T extends keyof ClientEvents ? ClientEvents[T] : unknown[]): Promise<void> | void;
}

export interface ListenerOptions<T extends keyof ClientEvents = ''> {
	name: T;

	once?: boolean;
}

declare module 'discord.js' {
	interface ClientEvents {
		[k: string]: unknown[];
	}
}
