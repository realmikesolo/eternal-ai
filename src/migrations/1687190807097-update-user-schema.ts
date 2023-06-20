import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserSchema1687190807097 implements MigrationInterface {
  name = 'UpdateUserSchema1687190807097';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "freeQuestions" boolean NOT NULL DEFAULT true`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "freeQuestions"`);
  }
}
