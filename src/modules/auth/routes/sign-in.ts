import { FastifyInstance, FastifyRequest } from 'fastify';
import { User, UserSchema } from '../models/user.model';
import S from 'fluent-json-schema';
import { HttpStatus } from '../../../core/server/status';
import {
  PasswordIsIncorrectException,
  UserNotFoundException,
  UserWasRegisteredWithAnotherMethod,
} from '../auth.exceptions';
import { compare } from 'bcrypt';
import { Schemas } from '../../../core/utils';
import { BadRequestException } from '../../../core/server/exceptions';
import { generateToken } from '../auth.helper';

export async function signIn(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/sign-in',
    {
      schema: {
        tags: ['auth'],
        description: 'Sign in',
        body: S.object()
          .additionalProperties(false)
          .prop('email', UserSchema.email.required())
          .prop('password', UserSchema.password.required()),
        response: {
          [HttpStatus.OK]: S.object().prop('token', S.string()).required(),
          [HttpStatus.NOT_FOUND]: Schemas.exception(UserNotFoundException),
          [HttpStatus.BAD_REQUEST]: Schemas.exception(BadRequestException, PasswordIsIncorrectException),
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

      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new UserNotFoundException();
      }

      if (user.method !== 'email') {
        throw new UserWasRegisteredWithAnotherMethod();
      }

      if (!(await compare(password, user.password))) {
        throw new PasswordIsIncorrectException();
      }

      const token = generateToken(user);

      res.status(HttpStatus.OK).send({ token });
    },
  );
}
