import { URL } from 'node:url';
import { envParseArray, envParseString, setup, type ArrayString } from '@skyra/env-utilities';
import { type ClientOptions, GatewayIntentBits, Partials, type WebhookClientData } from 'discord.js';
import { Time } from '@sapphire/timestamp';
import { BucketScope, LogLevel } from '@sapphire/framework';

process.env.NODE_ENV ??= 'development';
export const OWNERS = ['288703114473635841'];

setup(new URL('../.env', import.meta.url));

function parseWebhookError(): WebhookClientData | null {
	const { WEBHOOK_ERROR_TOKEN } = process.env;
	if (!WEBHOOK_ERROR_TOKEN) return null;

	return {
		id: envParseString('WEBHOOK_ERROR_ID'),
		token: WEBHOOK_ERROR_TOKEN,
	};
}

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

export function parseGrokToken() {
	return envParseString('GROK_TOKEN');
}

export function parseServers() {
	return envParseArray('DISCORD_SERVERS');
}

export const WEBHOOK_ERROR = parseWebhookError();

export const CLIENT_OPTIONS: ClientOptions = {
	intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
	partials: [Partials.Message, Partials.Channel],
	loadDefaultErrorListeners: false,
	loadMessageCommandListeners: true,
	defaultPrefix: null,
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
		GROK_TOKEN?: string;
		DISCORD_SERVERS?: ArrayString;
		WEBHOOK_ERROR_ID?: string;
		WEBHOOK_ERROR_TOKEN?: string;
	}
}
