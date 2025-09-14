import { REST, Routes } from 'discord.js';
import { envParseArray, envParseString, setup } from '@skyra/env-utilities';

setup(new URL('../.env', import.meta.url));

const TOKEN = envParseString('DISCORD_TOKEN');
const CLIENT_ID = envParseString('CLIENT_ID');
const SERVERS = envParseArray('DISCORD_SERVERS', []);

const rest = new REST().setToken(TOKEN);

if (SERVERS.length !== 0) {
	for (const serverId of SERVERS) {
		rest
			.put(Routes.applicationGuildCommands(CLIENT_ID, serverId), { body: [] })
			.then(() => console.log(`Successfully deleted all guild application commands for guild ${serverId}.`))
			.catch(console.error);
	}
}

rest
	.put(Routes.applicationCommands(CLIENT_ID), { body: [] })
	.then(() => console.log('Successfully deleted all global application commands.'))
	.catch(console.error);
