import { sign } from 'jsonwebtoken';
import { Env } from '../shared/env';
import { hash, genSalt } from 'bcrypt';
import { Credentials } from 'google-auth-library';
import axios from 'axios';

export function generateToken(user: { id: string; email: string; method: 'email' | 'google' }): string {
  return sign(JSON.parse(JSON.stringify(user)), Env.JWT_SECRET, { expiresIn: '1d' });
}

export async function hashPassword(password: string): Promise<string> {
  return hash(password, await genSalt(10));
}

export async function getGoogleUser(tokens: Credentials): Promise<{ email: string; name: string }> {
  const { access_token, id_token } = tokens;

  const googleUser = await axios
    .get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
      headers: {
        Authorization: `Bearer ${id_token}`,
      },
    })
    .then((r) => r.data)
    .catch((e) => {
      throw new Error(e.message);
    });

  return { email: googleUser.email, name: googleUser.name };
}

export function generateOtp(): number {
  return Math.floor(Math.random() * 90_000) + 10_000;
}