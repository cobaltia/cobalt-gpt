import { globbySync as sync } from 'globby';
import type { BotClient } from '#lib/BotClient';
import { container, type GenericCommand } from '#lib/structures';
import { resolveFile } from '#utils/utils';

export async function CommandRegistry(bot: BotClient) {
	try {
		const files = sync('./dist/commands/**/*.js');
		await Promise.all(files.map(async file => loadCommand(file, bot)));
	} catch (error) {
		console.log(error);
	}
}

async function loadCommand(file: string, bot: BotClient) {
	const command = await resolveFile<GenericCommand>(file);
	if (!command) return;
	command.bot = bot;
	container.commands.set(command.name, command);
	console.log(`Registering command: ${command.name}`);
}
