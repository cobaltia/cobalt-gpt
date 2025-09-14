import { CLIENT_OPTIONS } from '#root/config';
import { SapphireClient } from '@sapphire/framework';

export class BotClient extends SapphireClient {
	public constructor() {
		super(CLIENT_OPTIONS);
	}
}
