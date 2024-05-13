import { envParseString } from '@skyra/env-utilities';
import { type Snowflake, type RESTGetAPIApplicationGuildCommandsResult, Routes } from 'discord-api-types/v10';
import { REST } from 'discord.js';
import { parseClient, parseServers } from './config.js';
import { askCommand, generateCommand } from '#root/interactions';

const client = parseClient();
const servers = parseServers();
const rest = new REST({ version: '10' }).setToken(envParseString('DISCORD_TOKEN'));

try {
	console.log('Start refreshing interaction (/) commands.');

	for (const server of servers) {
		(await rest.put(Routes.applicationGuildCommands(client.id as Snowflake, server as Snowflake), {
			body: [askCommand, generateCommand],
		})) as RESTGetAPIApplicationGuildCommandsResult;
	}

	console.log('Successfully reloaded interaction (/) commands.');
} catch (error) {
	console.error(error);
}

declare module '@skyra/env-utilities' {
	interface Env {
		DISCORD_TOKEN: string;
	}
}
