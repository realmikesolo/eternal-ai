import { FastifyRequest } from 'fastify';
import { UnauthorizedException } from '../exceptions/http.exception';
import { JwtPayload, verify } from 'jsonwebtoken';
import { Env } from '../shared/env';
import { Socket } from 'socket.io';
import { User } from '../entities/models/user.model';

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

export async function authPluginSocket(socket: Socket): Promise<void> {
  try {
    const [type, token] = (socket.handshake.auth ?? '').split(' ');

    if (type !== 'Bearer' || !token) {
      return;
    }

    const user = verify(token, Env.JWT_SECRET) as JwtPayload;

    socket['user'] = user;
  } catch (e) {
    console.error(e);
  }
}

export type AuthSocket = Socket & {
  user: Pick<User, 'id' | 'email' | 'method' | 'subscriptionExpiresAt'>;
};

export type AuthRequest = FastifyRequest & {
  user: Pick<User, 'id' | 'email' | 'method' | 'subscriptionExpiresAt'>;
};
