import Stripe from 'stripe';
import { stripeClient } from '../configs/stripe.config';
import {
  UserHasAlreadySubscribedException,
  UserHasNotSubscribedException,
  UserNotFoundException,
} from '../exceptions/user.exception';
import { UserRepository } from '../repositories/user.repository';
import { Env } from '../shared/env';
import { SubscribeDto, SubscribeWebhookDto } from '../entities/dtos/payment.dto';

export class PaymentService {
  private userRepository = new UserRepository();

  public async subscribe(
    ctx: SubscribeDto & { email: string },
  ): Promise<
    Pick<
      Stripe.Subscription,
      'id' | 'status' | 'current_period_start' | 'current_period_end' | 'collection_method' | 'customer'
    >
  > {
    const { email, cardNumber, expMonth, expYear, cvc } = ctx;

    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.subscriptionExpiresAt) {
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

    let customer: Stripe.Response<Stripe.Customer | Stripe.DeletedCustomer>;

    if (user.stripeId) {
      customer = await stripeClient.customers.retrieve(user.stripeId);
      console.log(1, customer);
    } else {
      customer = await stripeClient.customers.create({
        email: user.email,
        payment_method: paymentMethod.id,
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      await this.userRepository.updateUser(user, { stripeId: customer.id });
    }
    console.log(2, user);

    const subscription = await stripeClient.subscriptions.create({
      customer: customer.id,
      items: [{ price: Env.STRIPE_PRICE_ID }],
      collection_method: 'charge_automatically',
    });

    return {
      id: subscription.id,
      status: subscription.status,
      current_period_start: subscription.current_period_start,
      current_period_end: subscription.current_period_end,
      collection_method: subscription.collection_method,
      customer: subscription.customer,
    };
  }

  public async paymentWebhook(ctx: SubscribeWebhookDto): Promise<void> {
    const event = stripeClient.webhooks.constructEvent(ctx.body, ctx.signature, Env.STRIPE_WEBHOOK_SECRET);
    const customerSubscription = event.data.object as Stripe.Subscription;

    const user = await this.userRepository.getUserByStripeId(
      (event.data.object as Stripe.Subscription).customer as string,
    );
    if (!user) {
      throw new UserNotFoundException();
    }

    switch (event.type) {
      case 'customer.subscription.created': {
        console.log(33);
        if (customerSubscription.status === 'active') {
          await this.userRepository.updateUser(user, {
            subscriptionExpiresAt: customerSubscription.current_period_end,
          });
          console.log(44, user);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        await stripeClient.paymentMethods.detach(customerSubscription.default_payment_method as string);

        await this.userRepository.updateUser(user, {
          subscriptionExpiresAt: customerSubscription.current_period_end,
        });

        break;
      }

      case 'customer.subscription.updated': {
        if (customerSubscription.status === 'active') {
          await this.userRepository.updateUser(user, {
            subscriptionExpiresAt: customerSubscription.current_period_end,
          });
        }
        if (
          customerSubscription.status === 'incomplete_expired' ||
          customerSubscription.status === 'unpaid' ||
          customerSubscription.status === 'canceled'
        ) {
          await stripeClient.paymentMethods.detach(customerSubscription.default_payment_method as string);
        }

        break;
      }

      default: {
        console.log(`Unhandled event type ${event.type}`);
      }
    }
  }

  public async unsubscribe(ctx): Promise<void> {
    const { email } = ctx;

    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }
    console.log(60, user);
    if (!user.subscriptionExpiresAt) {
      throw new UserHasNotSubscribedException();
    }

    const customer = await stripeClient.customers.retrieve(user.stripeId!);

    console.log(customer);
  }
}
