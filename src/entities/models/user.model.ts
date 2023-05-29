import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  public email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public password: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public name: string;

  @Column({ type: 'enum', enum: ['email', 'google'], default: 'email' })
  public method: RegisterMethod;
}

type RegisterMethod = 'email' | 'google';
