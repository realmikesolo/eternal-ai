import { PgErrors } from '@hibanka/pg-utils';
import { User } from '../entities/models/user.model';
import { UserWithSuchEmailAlreadyExistsException } from '../exceptions/user.exception';
import { LessThan } from 'typeorm';
import { hash, genSalt } from 'bcrypt';

export class UserRepository {
  public async createUser(data: {
    email: string;
    password?: string;
    method: 'google' | 'email';
    name?: string;
  }): Promise<User> {
    const { email, password, method, name } = data;

    const user = new User();

    user.email = email;
    user.password = password ? await this.hashPassword(password) : '';
    user.method = method;
    user.name = name ?? '';

    try {
      await user.save();
    } catch (e) {
      if (e.code === PgErrors.UNIQUE_VIOLATION) {
        throw new UserWithSuchEmailAlreadyExistsException();
      }
      throw e;
    }

    return user;
  }

  public async changeUserPassword(user: User, password: string): Promise<void> {
    user.password = await this.hashPassword(password);

    await user.save();
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    return User.findOneBy({ email });
  }

  public async getUserById(id: string): Promise<User | null> {
    return User.findOneBy({ id });
  }

  public async getUserByStripeId(stripeId: string): Promise<User | null> {
    return User.findOneBy({ stripeId });
  }

  public async updateUser(id: string, data: Partial<Omit<User, 'id'>>): Promise<void> {
    console.log(5, data);
    try {
      await User.update(id, {
        ...data,
        ...(data.password && { password: await this.hashPassword(data.password) }),
      });
    } catch (e) {
      if (e.code === PgErrors.UNIQUE_VIOLATION) {
        throw new UserWithSuchEmailAlreadyExistsException();
      }

      throw e;
    }
  }

  public async getUsersWithExpiredSubscription(): Promise<User[]> {
    return User.findBy({ subscriptionExpiresAt: LessThan(Math.floor(Date.now() / 1000)) });
  }

  private async hashPassword(password: string): Promise<string> {
    return hash(password, await genSalt(10));
  }
}
