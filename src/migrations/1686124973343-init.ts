import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1686124973343 implements MigrationInterface {
    name = 'Init1686124973343'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "characters" ("id" SERIAL NOT NULL, "fullName" character varying(255) NOT NULL, CONSTRAINT "PK_9d731e05758f26b9315dac5e378" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_method_enum" AS ENUM('email', 'google')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(255) NOT NULL, "password" character varying(255), "name" character varying(255), "method" "public"."users_method_enum" NOT NULL DEFAULT 'email', "phoneNumber" character varying(255), "stripeId" character varying(255), "subscriptionExpiresAt" integer, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_method_enum"`);
        await queryRunner.query(`DROP TABLE "characters"`);
    }

}
