import { MigrationInterface, QueryRunner } from 'typeorm';

export class Init1684775821087 implements MigrationInterface {
  name = 'Init1684775821087';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying(255)`);
    await queryRunner.query(`CREATE TYPE "public"."users_method_enum" AS ENUM('email', 'google')`);
    await queryRunner.query(
      `ALTER TABLE "users" ADD "method" "public"."users_method_enum" NOT NULL DEFAULT 'email'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "method"`);
    await queryRunner.query(`DROP TYPE "public"."users_method_enum"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
  }
}
