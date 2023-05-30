import { HttpException } from './http.exception';
import { HttpStatus } from '../shared/status';

export class UserWithSuchEmailAlreadyExistsException extends HttpException {
  constructor() {
    super(HttpStatus.CONFLICT, { message: 'USER_WITH_SUCH_EMAIL_ALREADY_EXISTS', success: false });
  }
}

export class UserNotFoundException extends HttpException {
  constructor() {
    super(HttpStatus.NOT_FOUND, { message: 'USER_NOT_FOUND', success: false });
  }
}

export class PasswordIsIncorrectException extends HttpException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, { message: 'PASSWORD_IS_INCORRECT', success: false });
  }
}

export class UserWasRegisteredWithAnotherMethod extends HttpException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, { message: 'USER_WAS_REGISTERED_WITH_ANOTHER_METHOD', success: false });
  }
}
