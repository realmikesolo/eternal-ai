import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1685619537393 implements MigrationInterface {
  name = 'Init1685619537393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "stripeId" character varying(255)`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "subscription" character varying(255) NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscription"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeId"`);
  }
}
