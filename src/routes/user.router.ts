import { FastifyInstance, FastifyRequest } from 'fastify';
import {
  PasswordIsIncorrectException,
  UserNotFoundException,
  UserWasRegisteredWithAnotherMethod,
  UserWithSuchEmailAlreadyExistsException,
} from '../exceptions/user.exception';
import { ExceptionSchemas } from '../schemas/exception.schema';
import { HttpStatus } from '../shared/status';
import { BadRequestException, ForbiddenException, UnauthorizedException } from '../exceptions/http.exception';
import {
  SignUpResponseSchema,
  GetUserAccountResponseSchema,
  SignUpRequestSchema,
  SignInRequestSchema,
  SignInResponseSchema,
  GoogleAuthRequestSchema,
  ForgotPasswordSendRequestSchema,
  ForgotPasswordSendResponseSchema,
  ForgotPasswordChangeRequestSchema,
  ForgotPasswordChangeResponseSchema,
  UpdateUserRequestSchema,
  UpdateUserResponseSchema,
} from '../schemas/user.schema';
import { AuthRequest, authPlugin } from '../plugins/auth.plugin';
import { UserService } from '../services/user.service';
import {
  ForgotPasswordChangeDto,
  ForgotPasswordSendDto,
  GoogleAuthDto,
  SignInDto,
  SignUpDto,
  UpdateUserDto,
} from '../entities/dtos/user.dto';
import { Env } from '../shared/env';

const userService = new UserService();

export async function userRouter(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/sign-up',
    {
      schema: {
        tags: ['user'],
        description: 'Sign up',
        body: SignUpRequestSchema(),
        response: {
          [HttpStatus.CREATED]: SignUpResponseSchema(),
          [HttpStatus.BAD_REQUEST]: ExceptionSchemas.exception(BadRequestException),
          [HttpStatus.CONFLICT]: ExceptionSchemas.exception(UserWithSuchEmailAlreadyExistsException),
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: SignUpDto;
      }>,
      res,
    ) => {
      const user = await userService.signUp(req.body);

      res.status(HttpStatus.CREATED).send({ user, success: true });
    },
  );

  fastify.post(
    '/sign-in',
    {
      schema: {
        tags: ['user'],
        description: 'Sign in',
        body: SignInRequestSchema(),
        response: {
          [HttpStatus.OK]: SignInResponseSchema(),
          [HttpStatus.BAD_REQUEST]: ExceptionSchemas.exception(
            BadRequestException,
            PasswordIsIncorrectException,
            UserWasRegisteredWithAnotherMethod,
          ),
          [HttpStatus.NOT_FOUND]: ExceptionSchemas.exception(UserNotFoundException),
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: SignInDto;
      }>,
      res,
    ) => {
      const token = await userService.signIn(req.body);

      res.status(HttpStatus.OK).send({ token, success: true });
    },
  );

  fastify.get(
    '/google/auth',
    {
      schema: {
        tags: ['user'],
        description: 'Google auth',
        querystring: GoogleAuthRequestSchema(),
        response: {
          [HttpStatus.BAD_REQUEST]: ExceptionSchemas.exception(UserWasRegisteredWithAnotherMethod),
        },
      },
    },
    async (
      req: FastifyRequest<{
        Querystring: GoogleAuthDto;
      }>,
      res,
    ) => {
      const token = await userService.googleAuth(req.query);

      res.redirect(`${Env.FRONTEND_URL}/login-successful/?token=${token}`);
    },
  );

  fastify.post(
    '/forgot-password-send',
    {
      schema: {
        tags: ['user'],
        description: 'Forgot password send',
        body: ForgotPasswordSendRequestSchema(),
        response: {
          [HttpStatus.OK]: ForgotPasswordSendResponseSchema(),
          [HttpStatus.BAD_REQUEST]: ExceptionSchemas.exception(BadRequestException),
          [HttpStatus.FORBIDDEN]: ExceptionSchemas.exception(ForbiddenException),
          [HttpStatus.NOT_FOUND]: ExceptionSchemas.exception(UserNotFoundException),
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: ForgotPasswordSendDto;
      }>,
      res,
    ) => {
      const message = await userService.forgotPasswordSend(req.body);

      res.status(HttpStatus.OK).send({ message, success: true });
    },
  );

  fastify.post(
    '/forgot-password-change',
    {
      schema: {
        tags: ['user'],
        description: 'Forgot password change',
        body: ForgotPasswordChangeRequestSchema(),
        response: {
          [HttpStatus.OK]: ForgotPasswordChangeResponseSchema(),
          [HttpStatus.BAD_REQUEST]: ExceptionSchemas.exception(BadRequestException),
          [HttpStatus.FORBIDDEN]: ExceptionSchemas.exception(ForbiddenException),
          [HttpStatus.NOT_FOUND]: ExceptionSchemas.exception(UserNotFoundException),
        },
      },
    },
    async (
      req: FastifyRequest<{
        Body: ForgotPasswordChangeDto;
      }>,
      res,
    ) => {
      const message = await userService.forgotPasswordChange(req.body);

      res.status(HttpStatus.OK).send({ message, success: true });
    },
  );

  fastify.get(
    '/account',
    {
      schema: {
        tags: ['user'],
        description: 'Get account',
        security: [{ bearer: [] }],
        response: {
          [HttpStatus.OK]: GetUserAccountResponseSchema(),
          [HttpStatus.UNAUTHORIZED]: ExceptionSchemas.exception(UnauthorizedException),
          [HttpStatus.NOT_FOUND]: ExceptionSchemas.exception(UserNotFoundException),
        },
      },
      preHandler: [authPlugin],
    },
    async (req: AuthRequest, res) => {
      const { user, hasSubscription } = await userService.getUserAccount(req.user);

      res.status(HttpStatus.OK).send({ user: { ...user, hasSubscription }, success: true });
    },
  );

  fastify.patch<{ Body: UpdateUserDto }>(
    '/update-user',
    {
      schema: {
        tags: ['user'],
        description: 'Update user',
        security: [{ bearer: [] }],
        body: UpdateUserRequestSchema(),
        response: {
          [HttpStatus.OK]: UpdateUserResponseSchema(),
          [HttpStatus.BAD_REQUEST]: ExceptionSchemas.exception(BadRequestException),
          [HttpStatus.UNAUTHORIZED]: ExceptionSchemas.exception(UnauthorizedException),
          [HttpStatus.FORBIDDEN]: ExceptionSchemas.exception(ForbiddenException),
          [HttpStatus.NOT_FOUND]: ExceptionSchemas.exception(UserNotFoundException),
        },
      },
      preHandler: [authPlugin],
    },
    async (req: AuthRequest & FastifyRequest<{ Body: UpdateUserDto }>, res) => {
      const { user, hasSubscription } = await userService.updateUser({
        id: req.user.id,
        method: req.user.method,
        ...req.body,
      });

      res.status(HttpStatus.OK).send({ user: { ...user, hasSubscription }, success: true });
    },
  );
}
