import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1685721924074 implements MigrationInterface {
  name = 'Init1685721924074';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "subscription" TO "subscriptionExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscriptionExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "subscriptionExpiresAt" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscriptionExpiresAt"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "subscriptionExpiresAt" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "subscriptionExpiresAt" TO "subscription"`);
  }
}
