import S, { ObjectSchema } from 'fluent-json-schema';

export const UserSchema = {
  id: S.string().format('uuid'),
  email: S.string().format('email'),
  password: S.string()
    .minLength(8)
    .maxLength(32)
    // eslint-disable-next-line unicorn/better-regex, no-useless-escape
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()-_=+\\|{}\[\];:,.<>\/?`~]+$/),
  name: S.string().minLength(1).maxLength(255),
  method: S.string().enum(['email', 'google']),
  phoneNumber: S.string().minLength(1).maxLength(255),
  stripeId: S.string().minLength(1).maxLength(255),
  subscriptionExpiresAt: S.number().raw({ nullable: true }),
  hasSubscription: S.boolean(),
};

const FullUserSchema = (): ObjectSchema => {
  return S.object()
    .prop(
      'user',
      S.object()
        .additionalProperties(false)
        .prop('id', UserSchema.id.required())
        .prop('email', UserSchema.email.required())
        .prop('name', UserSchema.name.required())
        .prop('method', UserSchema.method.required())
        .prop('phoneNumber', UserSchema.phoneNumber.required())
        .prop('stripeId', UserSchema.stripeId.required())
        .prop('subscriptionExpiresAt', UserSchema.subscriptionExpiresAt.required())
        .prop('hasSubscription', UserSchema.hasSubscription.required()),
    )
    .prop('success', S.boolean().required());
};

const EmailAndPasswordSchema = (): ObjectSchema => {
  return S.object()
    .additionalProperties(false)
    .prop('email', UserSchema.email.required())
    .prop('password', UserSchema.password.required());
};

const TokenSchema = (): ObjectSchema => {
  return S.object()
    .additionalProperties(false)
    .prop('token', S.string().required())
    .prop('success', S.boolean().required());
};

const MessageSchema = (): ObjectSchema => {
  return S.object()
    .additionalProperties(false)
    .prop('message', S.string().required())
    .prop('success', S.boolean().required());
};

export const SignUpRequestSchema = (): ObjectSchema => {
  return EmailAndPasswordSchema();
};

export const SignUpResponseSchema = (): ObjectSchema => {
  return S.object()
    .additionalProperties(false)
    .prop('user', S.object().prop('id', UserSchema.id.required()).prop('email', UserSchema.email.required()))
    .prop('success', S.boolean().required());
};

export const SignInRequestSchema = (): ObjectSchema => {
  return EmailAndPasswordSchema();
};

export const SignInResponseSchema = (): ObjectSchema => {
  return TokenSchema();
};

export const GoogleAuthRequestSchema = (): ObjectSchema => {
  return S.object().additionalProperties(false).prop('code', S.string().required());
};

export const GoogleAuthResponseSchema = (): ObjectSchema => {
  return TokenSchema();
};

export const ForgotPasswordSendRequestSchema = (): ObjectSchema => {
  return S.object().additionalProperties(false).prop('email', UserSchema.email.required());
};

export const ForgotPasswordSendResponseSchema = (): ObjectSchema => {
  return MessageSchema();
};

export const ForgotPasswordChangeRequestSchema = (): ObjectSchema => {
  return S.object()
    .additionalProperties(false)
    .prop('email', UserSchema.email.required())
    .prop('token', S.string().required())
    .prop('password', UserSchema.password.required());
};

export const ForgotPasswordChangeResponseSchema = (): ObjectSchema => {
  return MessageSchema();
};

export const GetUserAccountResponseSchema = (): ObjectSchema => {
  return FullUserSchema();
};

export const UpdateUserRequestSchema = (): ObjectSchema => {
  return S.object()
    .additionalProperties(false)
    .prop('email', UserSchema.email)
    .prop('name', S.string())
    .prop('phoneNumber', S.string())
    .prop('password', S.string());
};

export const UpdateUserResponseSchema = (): ObjectSchema => {
  return FullUserSchema();
};
