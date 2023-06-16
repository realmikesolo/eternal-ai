import Stripe from 'stripe';
import { stripeClient } from '../configs/stripe.config';
import {
  UserHasAlreadySubscribedException,
  UserHasNotSubscribedException,
  UserNotFoundException,
} from '../exceptions/user.exception';
import { UserRepository } from '../repositories/user.repository';
import { Env } from '../shared/env';
import {
  ChangePaymentMethodDto,
  SubscribeDto,
  SubscribeWebhookDto,
  UnsubscribeDto,
} from '../entities/dtos/payment.dto';
import { isUserSubscribed } from '../helpers/payment.helper';

export class PaymentService {
  private userRepository = new UserRepository();

  public async subscribe(
    ctx: SubscribeDto & { id: string },
  ): Promise<
    Pick<
      Stripe.Subscription,
      'id' | 'status' | 'current_period_start' | 'current_period_end' | 'collection_method' | 'customer'
    >
  > {
    const { id, cardNumber, expMonth, expYear, cvc } = ctx;

    const user = await this.userRepository.getUserById(id);
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

      await stripeClient.paymentMethods.attach(paymentMethod.id, {
        customer: customer.id,
      });

      await stripeClient.customers.update(customer.id, {
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });
    } else {
      customer = await stripeClient.customers.create({
        email: user.email,
        payment_method: paymentMethod.id,
        invoice_settings: {
          default_payment_method: paymentMethod.id,
        },
      });

      await this.userRepository.updateUser(user.id, { stripeId: customer.id });
    }

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
        if (customerSubscription.status === 'active') {
          await this.userRepository.updateUser(user.id, {
            subscriptionExpiresAt: customerSubscription.current_period_end,
          });
        }

        break;
      }

      case 'customer.subscription.deleted': {
        await stripeClient.paymentMethods.detach(customerSubscription.default_payment_method as string);

        await this.userRepository.updateUser(user.id, {
          subscriptionExpiresAt: customerSubscription.current_period_end,
        });

        break;
      }

      case 'customer.subscription.updated': {
        if (customerSubscription.status === 'active') {
          await this.userRepository.updateUser(user.id, {
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
      case 'invoice.payment_succeeded': {
        await this.userRepository.updateUser(user.id, {
          subscriptionExpiresAt: customerSubscription.current_period_end,
        });

        break;
      }

      default: {
        console.log(`Unhandled event type ${event.type}`);
      }
    }
  }

  public async unsubscribe(ctx: UnsubscribeDto): Promise<void> {
    const { id } = ctx;

    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (!user.subscriptionExpiresAt) {
      throw new UserHasNotSubscribedException();
    }

    if (!(await isUserSubscribed(user))) {
      throw new UserHasNotSubscribedException();
    }

    const customer = await stripeClient.customers.retrieve(user.stripeId!);

    const subscriptions = await stripeClient.subscriptions.list({
      customer: customer.id,
      current_period_end: user.subscriptionExpiresAt,
    });

    await stripeClient.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });
  }

  public async changePaymentMethod(ctx: ChangePaymentMethodDto & { id: string }): Promise<void> {
    const { id, cardNumber, expMonth, expYear, cvc } = ctx;

    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    const paymentMethods = await stripeClient.customers.listPaymentMethods(user.stripeId!, { type: 'card' });

    await stripeClient.paymentMethods.detach(paymentMethods.data[0].id);

    const paymentMethod = await stripeClient.paymentMethods.create({
      type: 'card',
      card: {
        number: cardNumber,
        exp_month: expMonth,
        exp_year: expYear,
        cvc,
      },
    });

    const customer = await stripeClient.customers.retrieve(user.stripeId!);

    await stripeClient.paymentMethods.attach(paymentMethod.id, {
      customer: customer.id,
    });

    await stripeClient.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });
  }
}
