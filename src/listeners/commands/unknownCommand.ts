import { sendGrokMessage } from '#lib/gpt';
import { getImage, truncate } from '#utils/utils';
import { Events, Listener, type UnknownMessageCommandPayload } from '@sapphire/framework';
import { AttachmentBuilder, MessageReferenceType, type Message } from 'discord.js';
import type OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources';

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
		const content: ChatCompletionContentPart[] = [{ type: 'text', text: cleanMessageContent }];
		if (image) content.push({ type: 'image_url', image_url: { url: image } });
		const repliedMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{ role: 'user', content }];

		let currentMessage: Message | null = message;

		while (currentMessage?.reference && currentMessage.reference.type === MessageReferenceType.Default) {
			try {
				const referencedMessage = await currentMessage.fetchReference();
				const cleanMessageContent = this.cleanMention(referencedMessage.content);
				const image = getImage(referencedMessage);

				const content: ChatCompletionContentPart[] = [{ type: 'text', text: cleanMessageContent }];
				if (image) content.push({ type: 'image_url', image_url: { url: image } });

				if (referencedMessage.author.bot) {
					repliedMessages.push({
						role: 'assistant',
						content,
					} as OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam);
				} else {
					repliedMessages.push({
						role: 'user',
						content,
					} as OpenAI.Chat.Completions.ChatCompletionUserMessageParam);
				}
				currentMessage = referencedMessage;
			} catch {
				break; // If fetching the reference fails, exit the loop
			}
		}

		const replyMsg = await message.reply('Thinking...');
		const finalMessage = repliedMessages.reverse();

		const response = await sendGrokMessage(finalMessage);

		if (!response.content) await replyMsg.edit('No response from Grok');
		if ((response.content?.length ?? 0) >= 2_000) {
			const attachment = new AttachmentBuilder(Buffer.from(response.content!.trim())).setName('response.txt');
			await replyMsg.edit({
				content: 'Your response was too long to be sent in a message. Here is a file instead.',
				files: [attachment],
			});
		} else {
			await replyMsg.edit(truncate(response.content!.trim(), 2_000));
		}

		this.container.logger.info(
			`Grok response to ${message.author.tag} (${message.author.id}) in ${message.guild.name} (${message.guildId})`,
		);
	}

	private cleanMention(content: string): string {
		return content.replace(/<@!?(\d+)>/g, '').trim();
	}
}
