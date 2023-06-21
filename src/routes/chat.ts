import { FastifyInstance } from 'fastify';
import { authPluginSocket, AuthSocket } from '../plugins/auth.plugin';
import { ChatService } from '../services/chat.service';

const chatService = new ChatService();

export async function chatRouter(fastify: FastifyInstance) {
  fastify.get('/chat', async (request, reply) => {
    fastify.io.use(async (socket, next) => {
      await authPluginSocket(socket);

      next();
    });

    fastify.io.on('connection', async (socket: AuthSocket) => {
      await chatService.connect(socket);
    });

    reply.send({ status: 'ok' });
  });
}
