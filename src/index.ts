import 'dotenv/config';
import { userRouter } from './routes/user.router';
import { startServer } from './server';
import { Env } from './shared/env';
import { connectDB } from './adapters/db';
import { connectRedis } from './adapters/redis';

(async () => {
  await connectDB();
  await connectRedis();
  await startServer({
    host: '0.0.0.0',
    port: Env.SERVER_PORT,
    routes: [userRouter],
  });
})();
