import { Collection } from 'discord.js';
import type { GenericCommand, Listener } from '#lib/structures';

export interface Container {
	listeners: Collection<string, Listener>;
	commands: Collection<string, GenericCommand>;
}

// @ts-expect-error: injected variables not initiated yet
export const container: Container = {
	listeners: new Collection<string, Listener>(),
	commands: new Collection<string, GenericCommand>(),
};
