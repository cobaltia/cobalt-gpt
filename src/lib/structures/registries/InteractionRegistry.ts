import { globbySync as sync } from 'globby';
import type { BotClient } from '#lib/BotClient';
import { type Listener, container } from '#lib/structures';
import { resolveFile } from '#utils/utils';

export async function ListenerRegistry(bot: BotClient) {
	try {
		const files = sync('./dist/listeners/**/*.js');
		await Promise.all(files.map(async file => loadListener(file, bot)));
	} catch (error) {
		console.log(error);
	}
}

async function loadListener(file: string, bot: BotClient) {
	const listener = await resolveFile<Listener>(file);
	if (!listener) return;
	listener.bot = bot;
	container.listeners.set(listener.name, listener);
	bot[listener.once ? 'once' : 'on'](listener.name, (...args: unknown[]) => listener.run(...args));
	console.log(`Registering listener: ${listener.name}`);
}
