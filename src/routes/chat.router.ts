import { FastifyInstance } from 'fastify';
import { HttpStatus } from '../shared/status';
import { ChatService } from '../services/chat.service';
import { AuthRequest } from '../plugins/auth.plugin';

const chatService = new ChatService();

export async function chatRouter(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/chat-history',
    {
      schema: {
        tags: ['chat'],
        description: 'Get chat history',
        response: {
          [HttpStatus.OK]: {
            type: 'object',
            properties: {
              messages: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    role: { type: 'string' },
                    content: { type: 'string' },
                  },
                },
              },
              success: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (req: AuthRequest, res) => {
      const messages = await chatService.getChatHistory(req.user.id);

      res.status(HttpStatus.OK).send({ messages, success: true });
    },
  );
}
