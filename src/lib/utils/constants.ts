import { URL } from 'node:url';

export const rootFolder = new URL('../../../', import.meta.url);
export const assetsFolder = new URL('assets/', rootFolder);

export const enum Colors {
	Red = 0x8f0a0a,
	Green = 0x118511,
	Blue = 0x2f7db1,
	Yellow = 0xac8408,
	Black = 0x000000,
}

export const COBALT_GUILD_ID = '322505254098698240';
export const CONTROL_GUILD_ID = '823300821994569748';
