import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { redisClient } from '../adapters/redis';
import { openai } from '../configs/open-ai.config';
import { AuthSocket } from '../plugins/auth.plugin';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/models/user.model';

export class ChatService {
  private userRepository = new UserRepository();

  public async connect(socket: AuthSocket): Promise<void> {
    if (!socket.user) {
      return this.sendSocketError(socket, 'error', 'UNAUTHORIZED');
    }

    const user = await this.userRepository.getUserById(socket.user.id);
    if (!user) {
      return this.sendSocketError(socket, 'error', 'UNAUTHORIZED');
    }

    if (!user.subscriptionExpiresAt) {
      const freeQuestions = await redisClient.get(this.buildRedisQuestionCountKey(user.id));
      if (!freeQuestions) {
        if (user.freeQuestions <= 0) {
          return this.sendSocketError(socket, 'error', 'NO_QUESTIONS_LEFT');
        }

        await redisClient.set(this.buildRedisQuestionCountKey(user.id), user.freeQuestions);
      }

      if (freeQuestions !== null && Number(freeQuestions) <= 0) {
        await this.userRepository.updateUser(user.id, { freeQuestions: 0 });

        return this.sendSocketError(socket, 'error', 'NO_QUESTIONS_LEFT');
      }
    }

    socket.on('hero', (message) => this.answerQuestion(user, socket, message));
  }

  private async answerQuestion(
    user: User,
    socket: AuthSocket,
    message: { hero?: string; question: string },
  ): Promise<void> {
    if (!user.subscriptionExpiresAt) {
      const freeQuestions = await redisClient.decr(this.buildRedisQuestionCountKey(user.id));
      if (freeQuestions < 0) {
        await this.userRepository.updateUser(user.id, { freeQuestions: 0 });

        return this.sendSocketError(socket, 'error', 'NO_QUESTIONS_LEFT');
      }
    }

    if (message.hero) {
      await redisClient.del(this.buildRedisMessageKey(user.id));

      await redisClient.rpush(
        this.buildRedisMessageKey(user.id),
        JSON.stringify({
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: this.generateSystemPrompt(message.hero),
        }),
      );

      await redisClient.expire(this.buildRedisMessageKey(user.id), 4 * 3600);
    }

    const userMessages = await redisClient
      .lrange(this.buildRedisMessageKey(user.id), 0, -1)
      .then((messages) => messages.map((message) => JSON.parse(message)));

    if (!userMessages?.length) {
      return this.sendSocketError(socket, 'error', 'HERO_WAS_NOT_SELECTED');
    }

    const userQuestion = { role: ChatCompletionRequestMessageRoleEnum.User, content: message.question };

    const content = await openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [...userMessages, userQuestion],
      })
      .then((response) => response.data.choices[0].message!.content);

    await redisClient.rpush(
      this.buildRedisMessageKey(user.id),
      JSON.stringify(userQuestion),
      JSON.stringify({
        role: ChatCompletionRequestMessageRoleEnum.Assistant,
        content,
      }),
    );

    socket.emit('hero', content);
  }

  private sendSocketError(socket: AuthSocket, event: string, error: string): void {
    socket.emit(event, error);

    socket.disconnect(true);
  }

  private generateSystemPrompt(name: string): string {
    return `You are ${name}. Engage as ${name} and respond to questions in character, providing insightful and forward-thinking answers as the real ${name} would.`;
  }

  private buildRedisMessageKey(userId: string): string {
    return `${userId}-messages`;
  }

  private buildRedisQuestionCountKey(userId: string): string {
    return `${userId}-questions-count`;
  }
}
