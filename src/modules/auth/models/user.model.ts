import S, { ObjectSchema } from 'fluent-json-schema';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  public email: string;

  @Column({ type: 'varchar', length: 255 })
  public password: string;
}

export const UserSchema = {
  id: S.string().format('uuid'),
  email: S.string().format('email').examples(['user@example.com']),
  password: S.string()
    .minLength(8)
    .maxLength(32)
    // eslint-disable-next-line unicorn/better-regex, no-useless-escape
    .pattern(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()-_=+\\|{}\[\];:,.<>\/?`~]+$/)
    .examples(['password123']),
};

export interface APIUser {
  id: string;
  email: string;
}

export const APIUserSchema = (): ObjectSchema => {
  return S.object().prop('id', UserSchema.id.required()).prop('email', UserSchema.email.required());
};
