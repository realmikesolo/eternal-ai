import { sign } from 'jsonwebtoken';
import { Env } from '../../core/env';
import { User } from './models/user.model';

export function generateToken(user: User): string {
  return sign(user, Env.JWT_SECRET, { expiresIn: '1d' });
}
