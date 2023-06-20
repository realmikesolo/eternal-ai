import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserQuestions1687194682808 implements MigrationInterface {
  name = 'UpdateUserQuestions1687194682808';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "freeQuestions"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "freeQuestions" integer NOT NULL DEFAULT '5'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "freeQuestions"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "freeQuestions" boolean NOT NULL DEFAULT true`);
  }
}
