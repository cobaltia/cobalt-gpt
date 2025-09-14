import '#lib/setup/all';
import process from 'node:process';
import { BotClient } from '#lib/BotClient';

const bot: BotClient = new BotClient();

try {
	await bot.login();
} catch (error) {
	console.log(error);
	await bot.destroy();
	process.exit(1);
}

process.on('SIGINT', async () => {
	await bot.destroy();
	process.exit(0);
});
