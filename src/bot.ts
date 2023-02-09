import process from 'node:process';
import { BotClient } from '#lib/BotClient';

const bot: BotClient = new BotClient();

try {
	await bot.login();
} catch (error) {
	console.log(error);
	process.exit(1);
}
