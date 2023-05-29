import { User } from '../entities/models/user.model';

export class UserRepository {
  public async getUserByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email } });
  }
}
