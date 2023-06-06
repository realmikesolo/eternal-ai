import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'characters' })
export class Character extends BaseEntity {
  @PrimaryGeneratedColumn('increment')
  public id: number;

  @Column({ type: 'varchar', length: 255 })
  public fullName: string;
}
