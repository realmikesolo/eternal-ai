import { MigrationInterface, QueryRunner } from 'typeorm';

export class Character1686052194311 implements MigrationInterface {
  name = 'Character1686052194311';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "characters" ("id" SERIAL NOT NULL, "fullName" character varying(255) NOT NULL, CONSTRAINT "PK_9d731e05758f26b9315dac5e378" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "characters"`);
  }
}
