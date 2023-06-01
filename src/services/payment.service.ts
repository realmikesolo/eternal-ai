import Stripe from 'stripe';
import { stripeClient } from '../configs/stripe.config';
import { UserHasAlreadySubscribedException, UserNotFoundException } from '../exceptions/user.exception';
import { UserRepository } from '../repositories/user.repository';
import { Env } from '../shared/env';

export class PaymentService {
  private userRepository = new UserRepository();

  public async subscribe(ctx): Promise<Stripe.Response<Stripe.Subscription>> {
    const { email, cardNumber, expMonth, expYear, cvc } = ctx;

    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.subscription) {
      throw new UserHasAlreadySubscribedException();
    }

    const paymentMethod = await stripeClient.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc,
      },
    });

    const customer = await stripeClient.customers.create({
      email: user.email,
      payment_method: paymentMethod.id,
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    const subscription = await stripeClient.subscriptions.create({
      customer: customer.id,
      items: [{ price: Env.STRIPE_PRICE_ID }],
      collection_method: 'charge_automatically',
    });

    return subscription;
  }
}
