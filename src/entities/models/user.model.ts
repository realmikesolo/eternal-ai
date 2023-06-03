import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  public email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public password: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public name: string | null;

  @Column({ type: 'enum', enum: ['email', 'google'], default: 'email' })
  public method: RegisterMethod;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public phoneNumber: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  public stripeId: string | null;

  @Column({ type: 'integer', nullable: true })
  public subscriptionExpiresAt: number | null;
}

type RegisterMethod = 'email' | 'google';
