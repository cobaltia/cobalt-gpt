import { URL } from 'node:url';
import { envParseArray, envParseString, setup, type ArrayString } from '@skyra/env-utilities';
import { type ClientOptions, GatewayIntentBits, Partials } from 'discord.js';
import { Time } from '@sapphire/timestamp';
import { BucketScope, LogLevel } from '@sapphire/framework';

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

export function parseServers() {
	return envParseArray('SERVERS');
}

export const CLIENT_OPTIONS: ClientOptions = {
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel],
	allowedMentions: { repliedUser: false },
	defaultCooldown: {
		delay: 5 * Time.Second,
		limit: 1,
		scope: BucketScope.User,
	},
	logger: {
		level: process.env.NODE_ENV === 'production' ? LogLevel.Info : LogLevel.Debug,
	},
};

declare module '@skyra/env-utilities' {
	interface Env {
		CLIENT_ID?: string;
		CLIENT_SECRET?: string;
		PROMPT_WEBHOOK_URL?: string;
		GPT_TOKEN?: string;
		SERVERS?: ArrayString;
	}
}
