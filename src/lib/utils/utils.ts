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
