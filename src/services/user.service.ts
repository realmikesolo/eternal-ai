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
import { generateOtp, generateToken, getGoogleUser } from '../helpers/user.helper';
import { oauth2Client } from '../configs/google.config';
import sgMail from '@sendgrid/mail';
import { Env } from '../shared/env';
import { redisClient } from '../adapters/redis';
import { ForbiddenException } from '../exceptions/http.exception';

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

    if (!(await compare(password, user.password))) {
      throw new PasswordIsIncorrectException();
    }

    return generateToken({ id: user.id, email: user.email, method: user.method });
  }

  public async googleAuth(ctx: GoogleAuthDto): Promise<string> {
    const { code } = ctx;

    const { tokens } = await oauth2Client.getToken(code);
    const { email, name } = await getGoogleUser(tokens);

    let user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      user = await this.userRepository.createUser({ email, name, method: 'google' });
    }

    if (user && user.method !== 'google') {
      throw new UserWasRegisteredWithAnotherMethod();
    }

    return generateToken({ id: user.id, email: user.email, method: user.method });
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

    const token = generateOtp();

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

  public async getUserAccount(ctx: GetUserAccountDto): Promise<User> {
    const { id } = ctx;

    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  public async updateUser(ctx: UpdateUserDto & { id: string; method: 'google' | 'email' }): Promise<User> {
    const { id, method, email, name, phoneNumber, password } = ctx;

    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new UserNotFoundException();
    }

    await this.userRepository.updateUser(
      user,
      method === 'google' ? { name, phoneNumber } : { email, name, phoneNumber, password },
    );

    return user;
  }
}
