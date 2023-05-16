import { FastifyInstance, FastifyRequest } from 'fastify';
import S from 'fluent-json-schema';
import { HttpStatus } from '../../../core/server/status';
import { User, UserSchema } from '../models/user.model';
import { UserNotFoundException } from '../auth.exceptions';
import { Schemas } from '../../../core/utils';
import { redisClient } from '../../../core/db/redis';
import sgMail from '@sendgrid/mail';
import { Env } from '../../../core/env';

export async function forgotPasswordSend(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/forgot-password-send',
    {
      schema: {
        tags: ['auth'],
        description: 'Forgot password send',
        body: S.object().additionalProperties(false).prop('email', UserSchema.email.required()),
        response: {
          [HttpStatus.OK]: S.object().prop('message', S.string()).required(),
          [HttpStatus.NOT_FOUND]: Schemas.exception(UserNotFoundException),
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: {
          email: string;
        };
      }>,
      res,
    ) => {
      const { email } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new UserNotFoundException();
      }

      sgMail.setApiKey(Env.SENDGRID_API_KEY);

      const token = Math.floor(Math.random() * 90_000) + 10_000;

      await Promise.all([
        redisClient.set(`forgot-password:${email}`, token, { EX: 60 * 60 * 24 }),
        sgMail.send({
          to: email,
          from: Env.SENDGRID_VERIFIED_EMAIL,
          subject: 'Password reset',
          html: `<h1>Reset your password</h1><p>Enter this code to reset your password: <b>${token}</b></p>`,
        }),
      ]);

      res.status(HttpStatus.OK).send({ message: 'Check your email' });
    },
  );
}
