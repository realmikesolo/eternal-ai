import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1685459589227 implements MigrationInterface {
  name = 'Init1685459589227';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "phoneNumber" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
  }
}
