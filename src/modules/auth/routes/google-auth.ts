import { FastifyInstance, FastifyRequest } from 'fastify';
import S from 'fluent-json-schema';
import { HttpStatus } from '../../../core/server/status';
import { Schemas } from '../../../core/utils';
import { UserWithSuchLoginAlreadyExistsException } from '../auth.exceptions';
import { oauth2Client } from '../../../core/db/google';
import axios from 'axios';
import { User } from '../models/user.model';
import { generateToken } from '../auth.helper';

export async function googleAuth(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/google/auth',
    {
      schema: {
        tags: ['auth'],
        description: 'Google auth',
        querystring: S.object().prop('code', S.string().required()),
        response: {
          [HttpStatus.OK]: S.object().prop('token', S.string()).required(),
          [HttpStatus.CONFLICT]: Schemas.exception(UserWithSuchLoginAlreadyExistsException),
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
        throw new UserWithSuchLoginAlreadyExistsException();
      }

      const token = generateToken(user);

      res.status(HttpStatus.OK).send({ token });
    },
  );
}
