import fastify from 'fastify';
import fastifyIO from 'fastify-socket.io';

export async function startWsServer(): Promise<void> {
  const server = fastify();
  console.log(1);
  server.register(fastifyIO);
  server.get('/', async (req, res) => {
    server.io.emit('Hello', 'World');
  });

  await server.ready();

  server.io.on('connection', (socket) => {
    socket.on('hero', (message) => {
      console.log(`Act as ${message}`);
    });
  });

  await server.listen({ port: 3001 });
}
