import { Client } from 'discord.js';
import { ListenerRegistry } from '#lib/structures';
import { CLIENT_OPTIONS } from '#root/config';

export class BotClient extends Client {
	public constructor() {
		super(CLIENT_OPTIONS);
	}

	public override async login(token?: string) {
		await Promise.all([ListenerRegistry(this)]);
		return super.login(token);
	}
}
