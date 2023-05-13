import 'dotenv/config';
import { resolve } from 'node:path';
import { Env } from '../env';
import { DataSource } from 'typeorm';

const url = `postgres://${Env.DB_USER}:${Env.DB_PASSWORD}@${Env.DB_HOST}/${Env.DB_DATABASE}?options=project%3D${Env.DB_ENDPOINT_ID}`;

export default new DataSource({
  type: 'postgres',
  url,
  ssl: true,
  entities: [resolve(__dirname, '../../modules/**/models/*.{ts,js}')],
  migrations: [resolve(__dirname, 'migrations/*.{ts,js}')],
  migrationsRun: true,
});
