import { FastifyRequest } from 'fastify';
import { UnauthorizedException } from '../../core/server/exceptions';
import { JwtPayload, verify } from 'jsonwebtoken';
import { Env } from '../../core/env';

export async function authMiddleware(req: FastifyRequest): Promise<void> {
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
