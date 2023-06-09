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

  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,

  CLIENT_URL: process.env.CLIENT_URL!,
  FRONTEND_URL: process.env.FRONTEND_URL!,

  REDIS_HOST: process.env.REDIS_HOST!,
  REDIS_PORT: Number(process.env.REDIS_PORT!),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD!,

  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,

  OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY!,
};
