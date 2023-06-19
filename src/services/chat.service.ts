import { redisClient } from '../adapters/redis';
import { AuthSocket } from '../plugins/auth.plugin';
import { UserRepository } from '../repositories/user.repository';

export class ChatService {
  private userRepository = new UserRepository();

  public async askQuestion(socket: AuthSocket): Promise<void> {
    if (!socket.user) {
      return this.sendSocketError(socket, 'error', 'unauthorized');
    }

    const user = await this.userRepository.getUserById(socket.user.id);
    if (!user) {
      return this.sendSocketError(socket, 'error', 'unauthorized');
    }

    if (!user.subscriptionExpiresAt) {
      const freeQuestions = await redisClient.get(`questions-count-${user.id}`);
      if (!freeQuestions) {
        if (user.freeQuestions <= 0) {
          return this.sendSocketError(socket, 'error', 'You have no free questions left');
        }

        await redisClient.set(`questions-count-${user.id}`, 5);
      }

      if (Number(freeQuestions) <= 0) {
        await this.userRepository.updateUser(user.id, { freeQuestions: 0 });

        return this.sendSocketError(socket, 'error', 'You have no free questions left');
      }
    }

    socket.on('hero', async (message) => {
      console.log(`Act as ${message}`);

      if (!user.subscriptionExpiresAt) {
        const freeQuestions = await redisClient.decr(`questions-count-${user.id}`);
        if (freeQuestions <= 0) {
          await this.userRepository.updateUser(user.id, { freeQuestions: 0 });

          return this.sendSocketError(socket, 'error', 'You have no free questions left');
        }
      }
    });
  }

  private sendSocketError(socket: AuthSocket, event: string, error: string): void {
    socket.emit(event, error);

    socket.disconnect(true);
  }
}
