import { handleChatInputOrContextMenuCommandSuccess } from '#utils/functions/successHelper';
import { type Events, Listener, type ChatInputCommandSuccessPayload } from '@sapphire/framework';

export class ChatInputCommandSuccessListener extends Listener<typeof Events.ChatInputCommandSuccess> {
	public override run(payload: ChatInputCommandSuccessPayload) {
		return handleChatInputOrContextMenuCommandSuccess(payload);
	}
}
