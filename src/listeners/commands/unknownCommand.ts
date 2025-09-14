import { sendGrokMessage } from '#lib/gpt';
import { truncate } from '#utils/utils';
import { Events, Listener, type UnknownMessageCommandPayload } from '@sapphire/framework';
import { AttachmentBuilder, MessageReferenceType, type Message } from 'discord.js';
import type OpenAI from 'openai';

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
		const repliedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
			{ role: 'user', content: cleanMessageContent },
		];
		let currentMessage: Message | null = message;

		while (currentMessage?.reference && currentMessage.reference.type === MessageReferenceType.Default) {
			try {
				const referencedMessage = await currentMessage.fetchReference();
				repliedMessages.push({
					role: referencedMessage.author.bot ? 'assistant' : 'user',
					content: this.cleanMention(referencedMessage.content),
				});
				currentMessage = referencedMessage;
			} catch {
				break; // If fetching the reference fails, exit the loop
			}
		}

		const response = await sendGrokMessage(repliedMessages.reverse());

		console.log('response:', response);

		if (!response.content) await message.reply('No response from Grok');
		if (response.content!.length ?? 0 > 2_000) {
			const attachment = new AttachmentBuilder(Buffer.from(response.content!.trim())).setName('response.txt');
			await message.reply({
				content: 'Your response was too long to be sent in a message. Here is a file instead.',
				files: [attachment],
			});
		} else {
			await message.reply(truncate(response.content!.trim(), 2_000));
		}
	}

	private cleanMention(content: string): string {
		return content.replace(/<@!?(\d+)>/g, '').trim();
	}
}
