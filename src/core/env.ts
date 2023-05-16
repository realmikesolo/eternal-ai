export const Env = {
  STAGE: process.env.STAGE! as 'local' | 'prod',

  SERVER_PORT: Number(process.env.SERVER_PORT!),

  JWT_SECRET: process.env.JWT_SECRET!,

  DB_HOST: process.env.DB_HOST!,
  DB_USER: process.env.DB_USER!,
  DB_PASSWORD: process.env.DB_PASSWORD!,
  DB_DATABASE: process.env.DB_DATABASE!,
  DB_ENDPOINT_ID: process.env.DB_ENDPOINT_ID!,

  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY!,
  SENDGRID_VERIFIED_EMAIL: process.env.SENDGRID_VERIFIED_EMAIL!,
};
