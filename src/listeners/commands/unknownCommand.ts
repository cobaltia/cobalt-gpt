import { sendGrokMessage } from '#lib/gpt';
import { getImage, truncate } from '#utils/utils';
import { Events, Listener, type UnknownMessageCommandPayload } from '@sapphire/framework';
import type { ModelMessage, UserContent } from 'ai';
import { AttachmentBuilder, MessageReferenceType, type Message } from 'discord.js';

export class ChatInputCommandDeniedListener extends Listener<typeof Events.UnknownMessageCommand> {
	public constructor(context: Listener.LoaderContext, options: Listener.Options) {
		super(context, {
			...options,
			event: Events.UnknownMessageCommand,
		});
	}

	public async run(payload: UnknownMessageCommandPayload) {
		const message = payload.message;
		if (message.author.bot) return;
		if (!message.guild) return;

		const cleanMessageContent = this.cleanMention(message.content);
		const image = getImage(message);
		const content: UserContent = [{ type: 'text', text: cleanMessageContent }];
		if (image) content.push({ type: 'file', data: new URL(image), mediaType: 'image/*' });
		const repliedMessages: ModelMessage[] = [{ role: 'user', content }];

		let currentMessage: Message | null = message;

		while (currentMessage?.reference && currentMessage.reference.type === MessageReferenceType.Default) {
			try {
				const referencedMessage = await currentMessage.fetchReference();
				const cleanMessageContent = this.cleanMention(referencedMessage.content);
				const image = getImage(referencedMessage);

				if (referencedMessage.author.bot) {
					repliedMessages.push({
						role: 'assistant',
						content: cleanMessageContent,
					});
				} else {
					const content: UserContent = [{ type: 'text', text: cleanMessageContent }];
					if (image) content.push({ type: 'file', data: new URL(image), mediaType: 'image/*' });
					repliedMessages.push({ role: 'user', content });
				}
				currentMessage = referencedMessage;
			} catch {
				break; // If fetching the reference fails, exit the loop
			}
		}

		const replyMsg = await message.reply('Thinking...');
		const finalMessage = repliedMessages.reverse();

		const response = await sendGrokMessage(finalMessage);

		if (!response) await replyMsg.edit('No response from Grok');
		if ((response?.length ?? 0) >= 2_000) {
			const attachment = new AttachmentBuilder(Buffer.from(response.trim())).setName('response.txt');
			await replyMsg.edit({
				content: 'Your response was too long to be sent in a message. Here is a file instead.',
				files: [attachment],
			});
		} else {
			await replyMsg.edit(truncate(response.trim(), 2_000));
		}

		this.container.logger.info(
			`Grok response to ${message.author.tag} (${message.author.id}) in ${message.guild.name} (${message.guildId})`,
		);
	}

	private cleanMention(content: string): string {
		return content.replace(/<@!?(\d+)>/g, '').trim();
	}
}
