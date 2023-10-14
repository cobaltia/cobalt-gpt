import { PrismaClient } from '@prisma/client';
import { Client } from 'discord.js';
import { CommandRegistry, ListenerRegistry, container } from '#lib/structures';
import { CLIENT_OPTIONS } from '#root/config';

export class BotClient extends Client {
	public constructor() {
		super(CLIENT_OPTIONS);
		container.db = new PrismaClient();
	}

	public override async login(token?: string) {
		await Promise.all([ListenerRegistry(this), CommandRegistry(this)]);
		return super.login(token);
	}
}

declare module '../lib/structures/Container.js' {
	interface Container {
		db: PrismaClient;
	}
}
