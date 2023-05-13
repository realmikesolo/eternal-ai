import 'dotenv/config';

import { startServer } from './core/server/server';
import { authRouter } from './modules/auth/auth.router';
import { Env } from './core/env';
import { connectDB } from './core/db/db';

(async () => {
  await connectDB();
  await startServer({
    host: '0.0.0.0',
    port: Env.SERVER_PORT,
    routes: [authRouter],
  });
})();
