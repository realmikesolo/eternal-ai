import { PgErrors } from '@hibanka/pg-utils';
import { User } from '../entities/models/user.model';
import { UserWithSuchLoginAlreadyExistsException } from '../exceptions/user.exception';
import { hashPassword } from '../helpers/user.helper';

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
    user.password = password ? await hashPassword(password) : '';
    user.method = method;
    user.name = name ?? '';

    try {
      await user.save();
    } catch (e) {
      if (e.code === PgErrors.UNIQUE_VIOLATION) {
        throw new UserWithSuchLoginAlreadyExistsException();
      }
      throw e;
    }

    return user;
  }

  public async changeUserPassword(user: User, password: string): Promise<void> {
    user.password = await hashPassword(password);

    await user.save();
  }

  public async getUserByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
}
