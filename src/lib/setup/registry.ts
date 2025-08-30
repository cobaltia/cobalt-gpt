import { parseServers } from '#root/config';
import { ApplicationCommandRegistries } from '@sapphire/framework';

ApplicationCommandRegistries.setDefaultGuildIds(parseServers())