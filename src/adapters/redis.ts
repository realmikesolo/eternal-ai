import { Env } from '../shared/env';
import { Redis } from 'ioredis';

export let redisClient: Redis;

export async function connectRedis(): Promise<void> {
  redisClient = new Redis({
    host: Env.REDIS_HOST,
    port: Env.REDIS_PORT,
    password: Env.REDIS_PASSWORD,
  });
}
