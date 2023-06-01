import Stripe from 'stripe';
import { Env } from '../shared/env';

export const stripeClient = new Stripe(Env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});
