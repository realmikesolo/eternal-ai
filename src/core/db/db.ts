import { resolve } from 'node:path';
import { Env } from '../env';
import { DataSource } from 'typeorm';

export let db: DataSource;
const url = `postgres://${Env.DB_USER}:${Env.DB_PASSWORD}@${Env.DB_HOST}/${Env.DB_DATABASE}?options=project%3D${Env.DB_ENDPOINT_ID}`;

export async function connectDB(): Promise<void> {
  db = new DataSource({
    type: 'postgres',
    url,
    ssl: true,
    logging: true,
    entities: [resolve(__dirname, '../../modules/**/models/*.model.{ts,js}')],
    migrations: [resolve(__dirname, 'migrations/*.{ts,js}')],
    migrationsRun: true,
  });

  await db.initialize();

  console.log('Data Source has been initialized!');
}
