import 'dotenv/config';
import { userRouter } from './routes/user.router';
import { startHttpServer } from './http-server';
import { Env } from './shared/env';
import { connectDB } from './adapters/db';
import { connectRedis } from './adapters/redis';
import { paymentRouter } from './routes/payment.router';
import { checkSubscriptionJob } from './workers/check-subscription.worker';
import { chatRouter } from './routes/chat.router';

(async () => {
  await connectDB();
  await connectRedis();
  await startHttpServer({
    host: '0.0.0.0',
    port: Env.SERVER_PORT,
    routes: [userRouter, paymentRouter, chatRouter],
  });
  checkSubscriptionJob.start();
})();
