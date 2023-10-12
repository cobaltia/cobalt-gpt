import type { Guild } from '@prisma/client';
import { container } from '#lib/structures';

const { db } = container;
type IGuild = Partial<Omit<Guild, 'id'>>;

export async function createGuild(id: string, data?: IGuild) {
	return db.guild.create({ data: { id, ...data } });
}

export async function getOrCreateGuild(id: string, data: IGuild) {
	try {
		return await getGuild(id);
	} catch {
		return await createGuild(id, data);
	}
}

export async function deleteGuild(id: string) {
	return db.guild.delete({ where: { id } });
}

export async function getGuild(id: string) {
	return db.guild.findUniqueOrThrow({ where: { id } });
}

export async function updateGuild(id: string, data?: IGuild) {
	return db.guild.upsert({
		create: {
			id,
			...data,
		},
		update: {
			...data,
		},
		where: { id },
	});
}
