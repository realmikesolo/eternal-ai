import { stripeClient } from '../configs/stripe.config';
import { User } from '../entities/models/user.model';

export async function isUserSubscribed(user: User): Promise<boolean> {
  const { stripeId, subscriptionExpiresAt } = user;
  if (!stripeId || !subscriptionExpiresAt) {
    return false;
  }

  const subscriptions = await stripeClient.subscriptions.list({
    customer: stripeId,
    current_period_end: subscriptionExpiresAt,
  });

  const subscription = subscriptions.data[0];

  return subscription.cancel_at ? false : subscription.status === 'active';
}
