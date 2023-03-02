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

export function parseWebhooks() {
	return {
		prompt: envParseString('PROMPT_WEBHOOK_URL'),
	};
}

export function parseGptToken() {
	return envParseString('GPT_TOKEN');
}

export function parsePerspectiveAPIKey() {
	return envParseString('PERSPECTIVE_API_KEY');
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
		PROMPT_WEBHOOK_URL?: string;
		GPT_TOKEN?: string;
		PERSPECTIVE_API_KEY?: string;
	}
}
