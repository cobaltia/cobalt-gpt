import { updateGuild } from './guild';
import { getOrCreateUser, updateUser } from './user';

export async function updateSuccessfulRuns(userId: string, guildId: string, amount = 1) {
	const user = await getOrCreateUser(userId, guildId);
	const guild = await getOrCreateUser(guildId, userId);
	await updateUser(userId, guildId, { numOfSuccessfulRuns: user.numOfSuccessfulRuns + amount });
	await updateGuild(guildId, { numOfSuccessfulRuns: guild.numOfSuccessfulRuns + amount });
}

export async function updateFailedRuns(userId: string, guildId: string, amount = 1) {
	const user = await getOrCreateUser(userId, guildId);
	const guild = await getOrCreateUser(guildId, userId);
	await updateUser(userId, guildId, { numOfFailedRuns: user.numOfFailedRuns + amount });
	await updateGuild(guildId, { numOfFailedRuns: guild.numOfFailedRuns + amount });
}
