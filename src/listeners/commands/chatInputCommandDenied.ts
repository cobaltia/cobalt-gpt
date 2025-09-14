import { type ChatInputCommandDeniedPayload, Events, Listener, type UserError } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandDenied } from '#utils/functions/deniedHelper';

export class ChatInputCommandDeniedListener extends Listener<typeof Events.ChatInputCommandDenied> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.ChatInputCommandDenied,
		});
	}

	public async run(error: UserError, payload: ChatInputCommandDeniedPayload) {
		return handleChatInputOrContextMenuCommandDenied(error, payload);
	}
}
