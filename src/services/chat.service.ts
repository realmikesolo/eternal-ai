import { ChatCompletionRequestMessageRoleEnum } from 'openai';
import { redisClient } from '../adapters/redis';
import { openai } from '../configs/open-ai.config';
import { AuthSocket } from '../plugins/auth.plugin';
import { UserRepository } from '../repositories/user.repository';
import { User } from '../entities/models/user.model';
import { Constants } from '../shared/constants';

export class ChatService {
  private userRepository = new UserRepository();

  public async connect(socket: AuthSocket): Promise<void> {
    if (!socket.user) {
      socket.emit('error', 'UNAUTHORIZED');

      socket.on('hero', async (message) => {
        if (!Constants.FREE_QUESTIONS.includes(message.question)) {
          return socket.emit('error', 'UNAUTHORIZED');
        }

        const userQuestion = {
          role: ChatCompletionRequestMessageRoleEnum.User,
          content: message.question,
        };

        const systemPrompt = {
          role: ChatCompletionRequestMessageRoleEnum.System,
          content: this.generateSystemPrompt(message.hero),
        };

        const content = await this.getAnswerFromOpenAI([systemPrompt], userQuestion);

        socket.emit('heroResponse', content);
      });

      return;
    }

    const user = await this.userRepository.getUserById(socket.user.id);
    if (!user) {
      return this.sendSocketError(socket, 'error', 'UNAUTHORIZED');
    }

    if (!user.subscriptionExpiresAt) {
      const freeQuestions = await redisClient.get(this.buildRedisQuestionCountKey(user.id));
      if (!freeQuestions) {
        if (user.freeQuestions <= 0) {
          return this.sendSocketError(socket, 'user-questions', 'NO_QUESTIONS_LEFT');
        }

        await redisClient.set(this.buildRedisQuestionCountKey(user.id), user.freeQuestions);
      }

      if (freeQuestions !== null && Number(freeQuestions) <= 0) {
        await this.userRepository.updateUser(user.id, { freeQuestions: 0 });

        return this.sendSocketError(socket, 'user-questions', 'NO_QUESTIONS_LEFT');
      }
    }

    socket.on('chat-history', (message) =>
      this.getChatHistory(user.id, message.hero).then((data) => socket.emit('chat-history', data)),
    );
    socket.on('hero', async (message) => {
      try {
        await this.answerQuestion(user, socket, message);
      } catch (e) {
        console.error(e);

        socket.emit('error', e.message ?? 'Unknown error with chat');
      }
    });
  }

  private async getChatHistory(userId: string, hero: string): Promise<ChatMessage[]> {
    return redisClient
      .lrange(this.buildRedisMessageKey(userId, hero), 0, -1)
      .then((messages) => messages.map((message) => JSON.parse(message) as ChatMessage));
  }

  private async answerQuestion(
    user: User,
    socket: AuthSocket,
    message: { hero: string; question: string },
  ): Promise<void> {
    if (!user.subscriptionExpiresAt) {
      const freeQuestions = await redisClient.decr(this.buildRedisQuestionCountKey(user.id));
      if (freeQuestions < 0) {
        await this.userRepository.updateUser(user.id, { freeQuestions: 0 });

        return this.sendSocketError(socket, 'user-questions', 'NO_QUESTIONS_LEFT');
      }
    }

    const chatHistory = await this.getChatHistory(user.id, message.hero);

    const userQuestion = { role: ChatCompletionRequestMessageRoleEnum.User, content: message.question };
    const prompt = {
      role: ChatCompletionRequestMessageRoleEnum.System,
      content: this.generateSystemPrompt(message.hero),
    };

    const content = await this.getAnswerFromOpenAI([prompt, ...chatHistory.slice(-1)], userQuestion);

    await redisClient.rpush(
      this.buildRedisMessageKey(user.id, message.hero),
      ...(userQuestion.content === Constants.GREETINGS ? [] : [JSON.stringify(userQuestion)]),
      JSON.stringify({
        role: ChatCompletionRequestMessageRoleEnum.Assistant,
        content,
      }),
    );

    if (!chatHistory?.length) {
      await redisClient.expire(this.buildRedisMessageKey(user.id, message.hero), Constants.CHAT_HISTORY_TTL);
    }

    socket.emit('heroResponse', content);
  }

  private sendSocketError(socket: AuthSocket, event: string, error: string): void {
    socket.emit(event, error);

    socket.disconnect(true);
  }

  private generateSystemPrompt(name: string): string {
    return `You are ${name}. Engage as ${name} and respond to questions in character, providing insightful, concise and short answers as the real ${name} would.`;
  }

  private buildRedisMessageKey(userId: string, hero: string): string {
    return `${userId}-${this.transformHeroName(hero)}-messages`;
  }

  private buildRedisQuestionCountKey(userId: string): string {
    return `${userId}-questions-count`;
  }

  private transformHeroName(name: string): string {
    return name.replaceAll(' ', '');
  }

  private async getAnswerFromOpenAI(
    messages: ChatMessage[],
    userQuestion: ChatMessage,
  ): Promise<string | undefined> {
    return openai
      .createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: [...messages, userQuestion],
        max_tokens: 256,
        temperature: 0.4,
      })
      .then((response) => response.data.choices[0].message!.content);
  }
}

type ChatMessage = {
  role: ChatCompletionRequestMessageRoleEnum;
  content: string;
};
