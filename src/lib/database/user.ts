import type { User } from '@prisma/client';
import { container } from '#lib/structures';

const { db } = container;
type IUser = Partial<Omit<User, 'guildId' | 'id'>>;

export async function createUser(userId: string, guildId: string, data?: IUser) {
	return db.user.create({
		data: {
			id: userId,
			guild: {
				connectOrCreate: { where: { id: guildId }, create: { id: guildId } },
			},
			...data,
		},
	});
}

export async function deleteUser(userId: string, guildId: string) {
	return db.user.delete({
		where: { userId: { id: userId, guildId } },
	});
}

export async function getUser(userId: string, guildId: string) {
	return db.user.findUniqueOrThrow({
		where: { userId: { id: userId, guildId } },
	});
}

export async function updateUser(userId: string, guildId: string, data?: IUser) {
	return db.user.upsert({
		create: {
			id: userId,
			guild: {
				connectOrCreate: { where: { id: guildId }, create: { id: guildId } },
			},
			...data,
		},
		update: {
			...data,
		},
		where: { userId: { id: userId, guildId } },
	});
}
