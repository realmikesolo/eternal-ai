import { RedisClientType, createClient } from 'redis';
import { Env } from '../shared/env';

export let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  redisClient = createClient({ socket: { host: Env.REDIS_HOST, port: Env.REDIS_PORT } });

  await redisClient
    .connect()
    .then(() => console.log('Redis connected'))
    .catch((e) => console.error(e));
}
