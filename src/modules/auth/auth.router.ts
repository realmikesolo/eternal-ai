import { FastifyInstance } from 'fastify';
import { signUp } from './routes/sign-up';
import { signIn } from './routes/sign-in';
import { forgotPasswordSend } from './routes/forgot-password-send';
import { forgotPasswordChange } from './routes/forgot-password-change';
import { googleAuth } from './routes/google-auth';
import { googleTest } from './routes/google-test';

export async function authRouter(fastify: FastifyInstance): Promise<void> {
  fastify.register(signUp);
  fastify.register(signIn);
  fastify.register(forgotPasswordSend);
  fastify.register(forgotPasswordChange);
  fastify.register(googleAuth);
  fastify.register(googleTest);
}
