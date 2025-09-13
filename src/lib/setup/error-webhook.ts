import { container } from '@sapphire/framework';
import { WebhookClient } from 'discord.js';
import { WEBHOOK_ERROR } from '#root/config';

container.webhookError = WEBHOOK_ERROR ? new WebhookClient(WEBHOOK_ERROR) : null;

declare module '@sapphire/framework' {
	interface Container {
		webhookError: WebhookClient | null;
	}
}
