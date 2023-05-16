import { FastifyInstance, FastifyRequest } from 'fastify';
import S from 'fluent-json-schema';
import { HttpStatus } from '../../../core/server/status';
import { User, UserSchema } from '../models/user.model';
import { UserNotFoundException } from '../auth.exceptions';
import { redisClient } from '../../../core/db/redis';
import { ForbiddenException } from '../../../core/server/exceptions';
import { Schemas } from '../../../core/utils';
import { genSalt, hash } from 'bcrypt';

export async function forgotPasswordChange(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/forgot-password-change',
    {
      schema: {
        tags: ['auth'],
        description: 'Forgot password change',
        body: S.object()
          .additionalProperties(false)
          .prop('email', UserSchema.email.required())
          .prop('token', S.string().required())
          .prop('password', UserSchema.password.required()),
        response: {
          [HttpStatus.OK]: S.object().prop('message', S.string()).required(),
          [HttpStatus.FORBIDDEN]: Schemas.exception(ForbiddenException),
          [HttpStatus.NOT_FOUND]: Schemas.exception(UserNotFoundException),
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: {
          email: string;
          token: string;
          password: string;
        };
      }>,
      res,
    ) => {
      const { email, token, password } = req.body;

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new UserNotFoundException();
      }

      const redisToken = await redisClient.get(`forgot-password:${email}`);
      if (redisToken !== token) {
        throw new ForbiddenException();
      }

      user.password = await hash(password, await genSalt(10));
      await user.save();

      await redisClient.del(`forgot-password:${email}`);

      res.status(HttpStatus.OK).send({ message: 'Password was changed' });
    },
  );
}
