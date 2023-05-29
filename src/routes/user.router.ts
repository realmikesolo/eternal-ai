import { FastifyInstance, FastifyRequest } from 'fastify';
import {
  PasswordIsIncorrectException,
  UserNotFoundException,
  UserWasRegisteredWithAnotherMethod,
  UserWithSuchLoginAlreadyExistsException,
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
  GoogleAuthResponseSchema,
  GoogleAuthRequestSchema,
  ForgotPasswordSendRequestSchema,
  ForgotPasswordSendResponseSchema,
  ForgotPasswordChangeRequestSchema,
  ForgotPasswordChangeResponseSchema,
} from '../schemas/user.schema';
import { AuthRequest, authPlugin } from '../plugins/auth.plugin';
import { UserService } from '../services/user.service';
import {
  ForgotPasswordChangeDto,
  ForgotPasswordSendDto,
  GoogleAuthDto,
  SignInDto,
  SignUpDto,
} from '../entities/dtos/user.dto';

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
          [HttpStatus.CONFLICT]: ExceptionSchemas.exception(UserWithSuchLoginAlreadyExistsException),
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
          [HttpStatus.NOT_FOUND]: ExceptionSchemas.exception(UserNotFoundException),
          [HttpStatus.BAD_REQUEST]: ExceptionSchemas.exception(
            BadRequestException,
            PasswordIsIncorrectException,
          ),
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
          [HttpStatus.OK]: GoogleAuthResponseSchema(),
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

      res.status(HttpStatus.OK).send({ token, success: true });
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
      const user = await userService.getUserAccount(req.user);

      res.status(HttpStatus.OK).send({ user, success: true });
    },
  );
}
