import { google } from 'googleapis';
import { Env } from '../shared/env';

export const oauth2Client = new google.auth.OAuth2(
  Env.GOOGLE_CLIENT_ID,
  Env.GOOGLE_CLIENT_SECRET,
  `${Env.CLIENT_URL}/google/auth`,
);
