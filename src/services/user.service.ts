import { compare } from 'bcrypt';
import {
  ForgotPasswordChangeDto,
  ForgotPasswordSendDto,
  GetUserAccountDto,
  GoogleAuthDto,
  SignInDto,
  SignUpDto,
  UpdateUserDto,
} from '../entities/dtos/user.dto';
import { User } from '../entities/models/user.model';
import {
  PasswordIsIncorrectException,
  UserNotFoundException,
  UserWasRegisteredWithAnotherMethod,
} from '../exceptions/user.exception';
import { UserRepository } from '../repositories/user.repository';
import { oauth2Client } from '../configs/google.config';
import sgMail from '@sendgrid/mail';
import { Env } from '../shared/env';
import { redisClient } from '../adapters/redis';
import { ForbiddenException } from '../exceptions/http.exception';
import { sign } from 'jsonwebtoken';
import { Credentials } from 'google-auth-library';
import axios from 'axios';
import { isUserSubscribed } from '../shared/utils';

export class UserService {
  private userRepository = new UserRepository();

  public async signUp(ctx: SignUpDto): Promise<User> {
    const { email, password } = ctx;

    const user = await this.userRepository.createUser({ email, password, method: 'email' });

    return user;
  }

  public async signIn(ctx: SignInDto): Promise<string> {
    const { email, password } = ctx;

    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.method !== 'email') {
      throw new UserWasRegisteredWithAnotherMethod();
    }

    if (!(await compare(password, user.password!))) {
      throw new PasswordIsIncorrectException();
    }

    return this.generateToken({
      id: user.id,
      email: user.email,
      method: user.method,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    });
  }

  public async googleAuth(ctx: GoogleAuthDto): Promise<string> {
    const { code } = ctx;

    const { tokens } = await oauth2Client.getToken(code);
    const { email, name } = await this.getGoogleUser(tokens);

    let user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      user = await this.userRepository.createUser({ email, name, method: 'google' });
    }

    if (user && user.method !== 'google') {
      throw new UserWasRegisteredWithAnotherMethod();
    }

    return this.generateToken({
      id: user.id,
      email: user.email,
      method: user.method,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
    });
  }

  public async forgotPasswordSend(ctx: ForgotPasswordSendDto): Promise<string> {
    const { email } = ctx;

    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.method !== 'email') {
      throw new ForbiddenException();
    }

    sgMail.setApiKey(Env.SENDGRID_API_KEY);

    const token = this.generateOtp();

    await Promise.all([
      redisClient.set(`forgot-password:${email}`, token, 'EX', 60 * 60 * 24),
      sgMail.send({
        to: email,
        from: Env.SENDGRID_VERIFIED_EMAIL,
        subject: 'Password reset',
        html: `<h1>Reset your password</h1><p>Enter this code to reset your password: <b>${token}</b></p>`,
      }),
    ]);

    return 'Check your email';
  }

  public async forgotPasswordChange(ctx: ForgotPasswordChangeDto): Promise<string> {
    const { email, token, password } = ctx;

    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }

    const redisToken = await redisClient.get(`forgot-password:${email}`);
    if (redisToken !== token) {
      throw new ForbiddenException();
    }

    await this.userRepository.changeUserPassword(user, password);

    await redisClient.del(`forgot-password:${email}`);

    return 'Password was changed';
  }

  public async getUserAccount(ctx: GetUserAccountDto): Promise<{ user: User; hasSubscription: boolean }> {
    const { id } = ctx;

    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    return { user, hasSubscription: await isUserSubscribed(user) };
  }

  public async updateUser(
    ctx: UpdateUserDto & Pick<User, 'id' | 'method'>,
  ): Promise<{ user: User; hasSubscription: boolean }> {
    const { id, method, email, name, phoneNumber, password } = ctx;

    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    const body: Partial<User> =
      method === 'google'
        ? this.filterBody({ name, phoneNumber })
        : this.filterBody({ email, name, phoneNumber, password });

    await this.userRepository.updateUser(id, body);

    return { user: { ...user, ...body } as User, hasSubscription: await isUserSubscribed(user) };
  }

  private generateToken(user: Pick<User, 'id' | 'email' | 'method' | 'subscriptionExpiresAt'>): string {
    return sign(JSON.parse(JSON.stringify(user)), Env.JWT_SECRET, { expiresIn: '1d' });
  }

  private generateOtp(): number {
    return Math.floor(Math.random() * 90_000) + 10_000;
  }

  private filterBody<T extends Record<string, any>>(body: T): Partial<T> {
    return Object.keys(body).reduce((acc, val) => {
      if (body[val] !== '') {
        acc[val] = body[val];
      }

      return acc;
    }, {});
  }

  private async getGoogleUser(tokens: Credentials): Promise<{ email: string; name: string }> {
    const { access_token, id_token } = tokens;

    const googleUser = await axios
      .get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${access_token}`, {
        headers: {
          Authorization: `Bearer ${id_token}`,
        },
      })
      .then((r) => r.data)
      .catch((e) => {
        throw new Error(e.message);
      });

    return { email: googleUser.email, name: googleUser.name };
  }
}
