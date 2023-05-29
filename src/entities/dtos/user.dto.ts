interface AuthDto {
  email: string;
  password: string;
}

export interface SignUpDto extends AuthDto {}

export interface SignInDto extends AuthDto {}

export interface GoogleAuthDto {
  code: string;
}

export interface ForgotPasswordSendDto {
  email: string;
}

export interface ForgotPasswordChangeDto {
  email: string;
  token: string;
  password: string;
}

export interface GetUserAccountDto {
  email: string;
}
