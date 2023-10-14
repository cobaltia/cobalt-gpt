import { envParseString } from '@skyra/env-utilities';
import { type Snowflake, type RESTGetAPIApplicationGuildCommandsResult, Routes } from 'discord-api-types/v10';
import { REST } from 'discord.js';
import { parseClient } from './config.js';
import { askCommand, statsCommand } from '#root/interactions';

const client = parseClient();
const rest = new REST({ version: '10' }).setToken(envParseString('DISCORD_TOKEN'));

try {
	console.log('Start refreshing interaction (/) commands.');

	(await rest.put(Routes.applicationGuildCommands(client.id as Snowflake, '823300821994569748' as Snowflake), {
		body: [askCommand, statsCommand],
	})) as RESTGetAPIApplicationGuildCommandsResult;

	console.log('Successfully reloaded interaction (/) commands.');
} catch (error) {
	console.error(error);
}

declare module '@skyra/env-utilities' {
	interface Env {
		DISCORD_TOKEN: string;
	}
}
