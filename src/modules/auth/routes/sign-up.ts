import { FastifyInstance, FastifyRequest } from 'fastify';
import S from 'fluent-json-schema';
import { APIUserSchema, User, UserSchema } from '../models/user.model';
import { HttpStatus } from '../../../core/server/status';
import { Schemas } from '../../../core/utils';
import { UserWithSuchLoginAlreadyExistsException } from '../auth.exceptions';
import { AuthService } from '../auth.service';
import { PgErrors } from '@hibanka/pg-utils';
import { hash, genSalt } from 'bcrypt';

const authService = new AuthService();

export async function signUp(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/sign-up',
    {
      schema: {
        tags: ['auth'],
        description: 'Sign up',
        body: S.object()
          .additionalProperties(false)
          .prop('email', UserSchema.email.required())
          .prop('password', UserSchema.password.required()),
        response: {
          [HttpStatus.CREATED]: APIUserSchema(),
          [HttpStatus.CONFLICT]: Schemas.exception(UserWithSuchLoginAlreadyExistsException),
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: {
          email: string;
          password: string;
        };
      }>,
      res,
    ) => {
      const { email, password } = req.body;

      const user = new User();
      user.email = email;
      user.password = await hash(password, await genSalt(10));

      try {
        await user.save();
      } catch (e) {
        if (e.code === PgErrors.UNIQUE_VIOLATION) {
          throw new UserWithSuchLoginAlreadyExistsException();
        }
        throw e;
      }

      res.status(HttpStatus.CREATED).send(user);
    },
  );
}
