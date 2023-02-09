import { Collection } from 'discord.js';
import type { Listener } from '#lib/structures';

export interface Container {
	listeners: Collection<string, Listener>;
}

export const container: Container = {
	listeners: new Collection<string, Listener>(),
};
