import { RedisClientType, createClient } from 'redis';

export let redisClient: RedisClientType;

export async function connectRedis(): Promise<void> {
  redisClient = createClient();

  await redisClient.connect();
}
