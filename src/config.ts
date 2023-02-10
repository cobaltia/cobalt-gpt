import { URL } from 'node:url';
import { envParseString, setup } from '@skyra/env-utilities';
import { type ClientOptions, GatewayIntentBits, Options, Partials } from 'discord.js';

setup(new URL('../.env', import.meta.url));

export function parseClient() {
	return {
		id: envParseString('CLIENT_ID'),
		secret: envParseString('CLIENT_SECRET'),
	};
}

export function parseGptToken() {
	return {
		token: envParseString('GPT_TOKEN'),
	};
}

export const CLIENT_OPTIONS: ClientOptions = {
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel],
	allowedMentions: { repliedUser: false },
	makeCache: Options.cacheEverything(),
	sweepers: { ...Options.DefaultSweeperSettings },
};

declare module '@skyra/env-utilities' {
	interface Env {
		CLIENT_ID?: string;
		CLIENT_SECRET?: string;
		GPT_TOKEN?: string;
	}
}
