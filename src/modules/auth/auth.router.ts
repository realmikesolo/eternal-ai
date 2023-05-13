import { FastifyInstance } from 'fastify';
import { signUp } from './routes/sign-up';
import { signIn } from './routes/sign-in';

export async function authRouter(fastify: FastifyInstance): Promise<void> {
  fastify.register(signUp);
  fastify.register(signIn);
}
