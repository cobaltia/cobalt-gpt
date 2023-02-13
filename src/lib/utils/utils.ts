import { URL } from 'node:url';
import { isClass } from '@sapphire/utilities';
import type { Listener } from '#lib/structures';

export function nword(text: string) {
	const r = /n+[1il|]+[469gkq]+[34aei]+[4ar]s?/;
	return r.test(text);
}

export function nazi(text: string) {
	const r = /n+[4a|]+z+[1il]s?/;
	return r.test(text);
}

export type Structures = Listener;

export async function resolveFile<T>(file: string) {
	const rootFolder = new URL('../../../', import.meta.url);
	const resolvedPath = new URL(file, rootFolder);
	const File = await (await import(resolvedPath.toString())).default;
	if (!isClass(File)) return null;
	return new File() as T;
}

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
