/* eslint-disable unicorn/new-for-builtins */
import { isMessageInstance } from '@sapphire/discord.js-utilities';
import {
	UserError,
	type ChatInputCommandErrorPayload,
	type ContextMenuCommandErrorPayload,
	container,
	type Command,
	Events,
} from '@sapphire/framework';
import {
	codeBlock,
	EmbedBuilder,
	type APIMessage,
	type Message,
	bold,
	hyperlink,
	hideLinkEmbed,
	ChatInputCommandInteraction,
	ContextMenuCommandInteraction,
} from 'discord.js';
import { OWNERS } from '#root/config';
import { Colors } from '#utils/constants';

const unknownErrorMessage =
	'An error occurred that I was not able to identify. Please try again. If error persists, please contact Juan.';

export async function handleChatInputOrContextMenuCommandError(
	error: Error,
	{ command, interaction }: ChatInputCommandErrorPayload | ContextMenuCommandErrorPayload,
) {
	if (error instanceof UserError) return userError(interaction, error);

	const { client, logger } = container;

	if (error.name === 'AbortError' || error.message === 'Internal Server Error') {
		return alert(interaction, 'I had a small network hiccup. Please try again.');
	}

	await sendErrorChannel(interaction, command, error);

	logger.fatal(`[COMMAND] ${command.location.full}\n${error.stack ?? error.message}`);
	try {
		await alert(interaction, generateUnexpectedErrorMessage(interaction, error));
	} catch (error) {
		client.emit(Events.Error, error as Error);
	}

	return undefined;
}

function generateUnexpectedErrorMessage(
	interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
	error: Error,
) {
	if (OWNERS.includes(interaction.user.id)) return codeBlock('js', error.stack!);
	return `I found an unexpected error, please report the steps you have taken to Juan.`;
}

export async function userError(
	interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
	error: UserError,
) {
	if (Reflect.get(Object(error.context), 'silent')) return;

	return alert(interaction, error.message || unknownErrorMessage);
}

async function alert(interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction, content: string) {
	if (interaction.replied || interaction.deferred) {
		return interaction.editReply({ content, allowedMentions: { users: [interaction.user.id], roles: [] } });
	}

	return interaction.reply({
		content,
		allowedMentions: { users: [interaction.user.id], roles: [] },
		ephemeral: true,
	});
}

async function sendErrorChannel(
	interaction: ChatInputCommandInteraction | ContextMenuCommandInteraction,
	command: Command,
	error: Error,
) {
	const webhook = container.webhookError;
	if (!webhook) return;

	const interactionReply = await interaction.fetchReply();

	const links = [
		getLinkLine(interactionReply),
		getCommandLine(command),
		getOptionsLine(interaction.options),
		getErrorLine(error),
	];

	const embed = new EmbedBuilder().setDescription(links.join('\n')).setColor(Colors.Red).setTimestamp();

	try {
		await webhook.send({ embeds: [embed] });
	} catch (error) {
		container.client.emit(Events.Error, error as Error);
	}
}

export function getErrorLine(error: Error) {
	if (error instanceof Error) return `**Error**: ${codeBlock('js', error.stack ?? error.message)}`;
	return `**Error**: ${codeBlock('js', error)}`;
}

function getCommandLine(command: Command) {
	return `**Command**: ${command.location.full}`;
}

function getOptionsLine(options: ChatInputCommandInteraction['options'] | ContextMenuCommandInteraction['options']) {
	if (options.data.length === 0) return '**Options**: None';

	const mappedOptions = [];
	for (const option of options.data) {
		mappedOptions.push(`**${option.name}**: ${option.value}`);
	}

	if (mappedOptions.length === 0) return '**Options**: None';

	return `**Options**: ${mappedOptions.join(', ')}`;
}

export function getLinkLine(message: APIMessage | Message) {
	if (isMessageInstance(message)) {
		return bold(hyperlink('Jump to message', hideLinkEmbed(message.url)));
	}
}
