import { type ChatInputCommandErrorPayload, Events, Listener } from '@sapphire/framework';
import { handleChatInputOrContextMenuCommandError } from '#utils/functions/errorHelpers';

export class ChatInputCommandErrorListener extends Listener<typeof Events.ChatInputCommandError> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.ChatInputCommandError,
		});
	}

	public async run(error: Error, payload: ChatInputCommandErrorPayload) {
		return handleChatInputOrContextMenuCommandError(error, payload);
	}
}
