import { PgErrors } from '@hibanka/pg-utils';
import { User } from '../entities/models/user.model';
import { UserWithSuchEmailAlreadyExistsException } from '../exceptions/user.exception';
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
        throw new UserWithSuchEmailAlreadyExistsException();
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
    return User.findOneBy({ email });
  }

  public async getUserById(id: string): Promise<User | null> {
    return User.findOneBy({ id });
  }

  public async updateUser(
    user: User,
    data: { email?: string; name?: string; phoneNumber?: string; password?: string; subscription?: boolean },
  ): Promise<void> {
    const { email, name, phoneNumber, password } = data;

    user.email = email ?? user.email;
    user.name = name ?? user.name;
    user.phoneNumber = phoneNumber ?? user.phoneNumber;
    user.subscription = data.subscription ?? user.subscription;
    user.password = password ? await hashPassword(password) : user.password;

    await user.save();
  }
}
