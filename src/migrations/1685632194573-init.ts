import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1685632194573 implements MigrationInterface {
  name = 'Init1685632194573';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscription"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "subscription" boolean NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscription"`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "subscription" character varying(255) NOT NULL DEFAULT false`,
    );
  }
}
