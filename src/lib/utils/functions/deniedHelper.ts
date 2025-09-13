import type { ChatInputCommandDeniedPayload, ContextMenuCommandDeniedPayload, UserError } from '@sapphire/framework';

export async function handleChatInputOrContextMenuCommandDenied(
	{ context, message: content }: UserError,
	{ interaction }: ChatInputCommandDeniedPayload | ContextMenuCommandDeniedPayload,
) {
	// eslint-disable-next-line unicorn/new-for-builtins
	if (Reflect.get(Object(context), 'silent')) return;

	return interaction.reply({
		content,
		allowedMentions: { users: [interaction.user.id], roles: [] },
		ephemeral: true,
	});
}
