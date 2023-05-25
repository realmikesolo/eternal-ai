import { FastifyInstance, FastifyRequest } from 'fastify';
import { APIUserSchema, User, UserSchema } from '../models/user.model';
import { PgErrors } from '@hibanka/pg-utils';
import { hash, genSalt, compare } from 'bcrypt';
import S from 'fluent-json-schema';
import {
  PasswordIsIncorrectException,
  UserNotFoundException,
  UserWasRegisteredWithAnotherMethod,
  UserWithSuchLoginAlreadyExistsException,
} from '../exceptions/user.exception';
import { Schemas } from '../schemas/utils';
import { HttpStatus } from '../shared/status';
import { BadRequestException, ForbiddenException } from '../exceptions/exceptions';
import { generateToken } from '../helpers/auth.helper';
import axios from 'axios';
import { oauth2Client } from '../configs/google.config';
import { redisClient } from '../adapters/redis';
import { Env } from '../shared/env';
import sgMail from '@sendgrid/mail';

export async function userRouter(fastify: FastifyInstance): Promise<void> {
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

  fastify.get(
    '/google/auth',
    {
      schema: {
        tags: ['auth'],
        description: 'Google auth',
        querystring: S.object().prop('code', S.string().required()),
        response: {
          [HttpStatus.OK]: S.object().prop('token', S.string()).required(),
          [HttpStatus.BAD_REQUEST]: Schemas.exception(UserWasRegisteredWithAnotherMethod),
        },
      },
    },
    async (
      req: FastifyRequest<{
        Querystring: {
          code: string;
        };
      }>,
      res,
    ) => {
      const { code } = req.query;

      const { tokens } = await oauth2Client.getToken(code);

      const googleUser = await axios
        .get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`, {
          headers: {
            Authorization: `Bearer ${tokens.id_token}`,
          },
        })
        .then((r) => r.data)
        .catch((e) => {
          throw new Error(e.message);
        });

      let user = await User.findOne({ where: { email: googleUser.email } });
      if (!user) {
        user = new User();
        user.email = googleUser.email;
        user.method = 'google';
        user.name = googleUser.name;

        await user.save();
      }

      if (user && user.method !== 'google') {
        throw new UserWasRegisteredWithAnotherMethod();
      }

      const token = generateToken(user);

      res.status(HttpStatus.OK).send({ token });
    },
  );

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