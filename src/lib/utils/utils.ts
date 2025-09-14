import type { Message } from 'discord.js';

export const IMAGE_EXTENSION = /\.(bmp|jpe?g|png|gif|webp)$/i;

/**
 * Truncate a string to a certain length
 *
 * @param str - The string to truncate
 * @param max - The max length of the string
 * @returns The truncated string minus the last 3 characters
 */
export function truncate(str: string, max: number) {
	return str.length > max ? `${str.slice(0, max - 3)}...` : str;
}

export function getContent(message: Message) {
	if (message.content) return message.content;
	for (const embed of message.embeds) {
		if (embed.description) return embed.description;
		if (embed.fields.length) return embed.fields[0].value;
	}

	return null;
}

export interface ImageAttachment {
	url: string;
	proxyURL: string;
	height: number;
	width: number;
}

export function getAttachment(message: Message): ImageAttachment | null {
	if (message.attachments.size) {
		const attachment = message.attachments.find(att => IMAGE_EXTENSION.test(att.name ?? att.url));
		if (attachment) {
			return {
				url: attachment.url,
				proxyURL: attachment.proxyURL,
				height: attachment.height!,
				width: attachment.width!,
			};
		}
	}

	for (const embed of message.embeds) {
		if (embed.image) {
			return {
				url: embed.image.url,
				proxyURL: embed.image.proxyURL!,
				height: embed.image.height!,
				width: embed.image.width!,
			};
		}

		if (embed.thumbnail) {
			return {
				url: embed.thumbnail.url,
				proxyURL: embed.thumbnail.proxyURL!,
				height: embed.thumbnail.height!,
				width: embed.thumbnail.width!,
			};
		}
	}

	return null;
}

export function getImage(message: Message) {
	const attachment = getAttachment(message);
	if (attachment) return attachment.proxyURL || attachment.url;

	const sticker = message.stickers.first();
	if (sticker) return sticker.url;
	return null;
}
