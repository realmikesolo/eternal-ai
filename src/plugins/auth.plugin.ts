import { FastifyRequest } from 'fastify';
import { UnauthorizedException } from '../exceptions/http.exception';
import { JwtPayload, verify } from 'jsonwebtoken';
import { Env } from '../shared/env';

export async function authPlugin(req: FastifyRequest): Promise<void> {
  try {
    const [type, token] = (req.headers.authorization ?? '').split(' ');

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException();
    }

    const user = verify(token, Env.JWT_SECRET) as JwtPayload;

    req['user'] = user;
  } catch (e) {
    console.error(e);

    throw new UnauthorizedException();
  }
}

export type AuthRequest = FastifyRequest & {
  user: { id: string; email: string; method: 'email' | 'google' };
};
