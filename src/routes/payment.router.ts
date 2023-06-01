import { FastifyInstance } from 'fastify';
import { PaymentService } from '../services/payment.service';
import { stripeClient } from '../configs/stripe.config';
import Stripe from 'stripe';

const paymentService = new PaymentService();

export async function paymentRouter(fastify: FastifyInstance): Promise<void> {
  fastify.post('/subsrcibe', {}, async (req, res) => {
    const subscription = await paymentService.subscribe(req.body);
    res.status(200).send(subscription);
  });

  fastify.post(
    '/webhook',
    {
      config: {
        rawBody: true,
      },
    },
    async (req, res) => {
      console.log(900, req.rawBody, 901, typeof req.rawBody);
      const endpointSecret = 'whsec_BPmGeB4rUfRQl5F5pJqPgJjrCoBrFMxm';

      const sig = req.headers['stripe-signature']!;

      let event: Stripe.Event;

      try {
        event = stripeClient.webhooks.constructEvent(req.rawBody!, sig, endpointSecret);
      } catch (e) {
        console.log(e);
        throw e;
      }
      console.log(300, event);
      // Handle the event
      switch (event.type) {
        case 'customer.subscription.created':
          // eslint-disable-next-line no-case-declarations
          const customerSubscriptionCreated = event.data.object;
          console.log(500, customerSubscriptionCreated);
          // Then define and call a function to handle the event customer.subscription.created
          break;
        case 'customer.subscription.deleted':
          // eslint-disable-next-line no-case-declarations
          const customerSubscriptionDeleted = event.data.object;
          console.log(600, customerSubscriptionDeleted);
          // Then define and call a function to handle the event customer.subscription.deleted
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    },
  );
}
