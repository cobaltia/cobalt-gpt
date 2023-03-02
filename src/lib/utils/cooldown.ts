import { Time } from '@sapphire/duration';
import { RateLimitManager } from '@sapphire/ratelimits';

const rateLimitManager = new RateLimitManager(Time.Hour, 50);
export const ratelimit = rateLimitManager.acquire('global');
