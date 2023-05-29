import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  HttpException,
  BadRequestException,
  InternalServerErrorException,
} from './exceptions/http.exception';
import { HttpStatus } from './shared/status';
import { writeFile } from 'node:fs/promises';
import path = require('path');
import { Env } from './shared/env';

export async function startServer(options: {
  host: string;
  port: number;
  routes: Array<(fastify: FastifyInstance) => void>;
}): Promise<void> {
  const fastify = Fastify({ logger: true });

  await fastify.register(import('@fastify/cors'), {});

  fastify.setErrorHandler(httpErrorHandler);
  fastify.setNotFoundHandler(httpNotFoundHandler);

  await fastify.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'Eternal AI API',
        description: 'Eternal AI API description',
        version: 'v1',
      },
      servers: [{ url: `http://localhost:${options.port}` }],
      tags: [{ name: 'user' }],
      components: {
        securitySchemes: {
          bearer: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
  });

  for (const route of options.routes) {
    fastify.register(route);
  }

  await fastify.ready();

  if (Env.STAGE === 'local') {
    const swagger = fastify.swagger({ yaml: true });
    await writeFile(path.resolve(__dirname, '../openapi.yml'), swagger);
  }

  await fastify.listen({ host: options.host, port: options.port });
  console.log(`Server has started on ${options.port} port`);
}

const httpErrorHandler = (error: any, req: FastifyRequest, res: FastifyReply): void => {
  if (error instanceof HttpException) {
    res.status(error.status).send(error.body);
  } else if (error.validation || error.status === HttpStatus.BAD_REQUEST) {
    console.warn(error.validation ?? error);

    const exception = new BadRequestException();
    res.status(exception.status).send(exception.body);
  } else {
    console.error(error);

    const exception = new InternalServerErrorException();
    res.status(exception.status).send(exception.body);
  }
};

const httpNotFoundHandler = (req: FastifyRequest, res: FastifyReply): void => {
  res.status(HttpStatus.NOT_FOUND).send({ code: 'ROUTE_NOT_FOUND' });
};
