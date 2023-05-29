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
};

export const SignUpUserSchema = (): ObjectSchema => {
  return S.object()
    .prop('user', S.object().prop('id', UserSchema.id.required()).prop('email', UserSchema.email.required()))
    .prop('success', S.boolean().required());
};

export const GetUserAccountSchema = (): ObjectSchema => {
  return S.object()
    .prop(
      'user',
      S.object()
        .prop('id', UserSchema.id.required())
        .prop('email', UserSchema.email.required())
        .prop('name', UserSchema.name.required())
        .prop('method', UserSchema.method.required()),
    )
    .prop('success', S.boolean().required());
};
