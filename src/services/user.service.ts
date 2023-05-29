import { GetUserAccountDto } from '../entities/dtos/user.dto';
import { User } from '../entities/models/user.model';
import { UserNotFoundException } from '../exceptions/user.exception';
import { UserRepository } from '../repositories/user.repository';

export class UserService {
  private userRepository = new UserRepository();

  public async getUserAccount(ctx: GetUserAccountDto): Promise<User> {
    const { email } = ctx;

    const user = await this.userRepository.getUserByEmail(email);
    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }
}
