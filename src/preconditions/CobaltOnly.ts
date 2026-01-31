import { Precondition } from '@sapphire/framework';
import { type ContextMenuCommandInteraction, type CommandInteraction } from 'discord.js';
import { COBALT_GUILD_ID, CONTROL_GUILD_ID } from '#lib/utils/constants';

export class CobaltOnlyPrecondition extends Precondition {
	#message = 'This command can only be used in the Cobalt Network server.';

	public override async chatInputRun(interaction: CommandInteraction) {
		return this.doCobaltCheck(interaction);
	}

	public override async contextMenuRun(interaction: ContextMenuCommandInteraction) {
		return this.doCobaltCheck(interaction);
	}

	private async doCobaltCheck(interaction: CommandInteraction | ContextMenuCommandInteraction) {
		const guildId = interaction.guildId;
		const allowedGuilds = [COBALT_GUILD_ID, CONTROL_GUILD_ID];
		if (!allowedGuilds.includes(guildId!)) return this.error({ message: this.#message });
		return this.ok();
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		CobaltOnly: never;
	}
}
