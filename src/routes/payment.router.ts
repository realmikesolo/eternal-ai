import { FastifyInstance, FastifyRequest } from 'fastify';
import { PaymentService } from '../services/payment.service';
import {
  SubscribeRequestSchema,
  SubscribeResponseSchema,
  UnsubscribeResponseSchema,
} from '../schemas/payment.schema';
import { HttpStatus } from '../shared/status';
import { ExceptionSchemas } from '../schemas/exception.schema';
import {
  UserHasAlreadySubscribedException,
  UserHasNotSubscribedException,
  UserNotFoundException,
} from '../exceptions/user.exception';
import { BadRequestException, UnauthorizedException } from '../exceptions/http.exception';
import { SubscribeDto } from '../entities/dtos/payment.dto';
import { AuthRequest, authPlugin } from '../plugins/auth.plugin';

const paymentService = new PaymentService();

export async function paymentRouter(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: SubscribeDto }>(
    '/subsrcibe',
    {
      schema: {
        tags: ['payment'],
        description: 'Subscribe',
        body: SubscribeRequestSchema(),
        response: {
          [HttpStatus.OK]: SubscribeResponseSchema(),
          [HttpStatus.BAD_REQUEST]: ExceptionSchemas.exception(
            UserHasAlreadySubscribedException,
            BadRequestException,
          ),
          [HttpStatus.UNAUTHORIZED]: ExceptionSchemas.exception(UnauthorizedException),
          [HttpStatus.NOT_FOUND]: ExceptionSchemas.exception(UserNotFoundException),
        },
      },
      preHandler: [authPlugin],
    },
    async (req: AuthRequest & FastifyRequest<{ Body: SubscribeDto }>, res) => {
      const subscription = await paymentService.subscribe({ email: req.user.email, ...req.body });

      res.status(200).send({ subscription, success: true });
    },
  );

  fastify.post(
    '/unsubscribe',
    {
      schema: {
        tags: ['payment'],
        description: 'Unsubscribe',
        response: {
          [HttpStatus.OK]: UnsubscribeResponseSchema(),
          [HttpStatus.BAD_REQUEST]: ExceptionSchemas.exception(UserHasNotSubscribedException),
          [HttpStatus.UNAUTHORIZED]: ExceptionSchemas.exception(UnauthorizedException),
          [HttpStatus.NOT_FOUND]: ExceptionSchemas.exception(UserNotFoundException),
        },
      },
      preHandler: [authPlugin],
    },
    async (req: AuthRequest, res) => {
      await paymentService.unsubscribe(req.user);

      res.status(200).send({ message: 'Unsubscribed', success: true });
    },
  );

  fastify.post(
    '/webhook',
    {
      config: {
        rawBody: true,
      },
    },
    async (req, res) => {
      await paymentService.paymentWebhook({
        body: req.rawBody!,
        signature: req.headers['stripe-signature']!,
      });
    },
  );
}
