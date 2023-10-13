import { getOrCreateGuild, updateGuild } from './guild.js';
import { getOrCreateUser, updateUser } from './user.js';

export async function updateSuccessfulRuns(userId: string, guildId: string, amount = 1) {
	const user = await getOrCreateUser(userId, guildId);
	const guild = await getOrCreateGuild(guildId);
	await updateUser(userId, guildId, {
		numOfSuccessfulRuns: user.numOfSuccessfulRuns + amount,
		totalRuns: user.totalRuns + amount,
	});
	await updateGuild(guildId, {
		numOfSuccessfulRuns: guild.numOfSuccessfulRuns + amount,
		totalRuns: guild.totalRuns + amount,
	});
}

export async function updateFailedRuns(userId: string, guildId: string, amount = 1) {
	const user = await getOrCreateUser(userId, guildId);
	const guild = await getOrCreateGuild(guildId);
	await updateUser(userId, guildId, {
		numOfFailedRuns: user.numOfFailedRuns + amount,
		totalRuns: user.totalRuns + amount,
	});
	await updateGuild(guildId, { numOfFailedRuns: guild.numOfFailedRuns + amount, totalRuns: guild.totalRuns + amount });
}

export async function updateInfractions(userId: string, guildId: string, amount = 1) {
	const user = await getOrCreateUser(userId, guildId);
	const guild = await getOrCreateGuild(guildId);
	await updateUser(userId, guildId, { infractions: user.infractions + amount });
	await updateGuild(guildId, { infractions: guild.infractions + amount });
}
