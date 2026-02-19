import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1708105200000 implements MigrationInterface {
  name = 'InitialSchema1708105200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ENUM type for roles
    await queryRunner.query(`
      CREATE TYPE "public"."users_role_enum" AS ENUM('voter', 'volunteer', 'campaign_staff', 'election_official', 'admin')
    `);

    // Users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "email" character varying(255) NOT NULL,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "firstName" character varying(100) NOT NULL,
        "lastName" character varying(100) NOT NULL,
        "passwordHash" character varying(255) NOT NULL,
        "role" "public"."users_role_enum" NOT NULL DEFAULT 'voter',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastLoginAt" TIMESTAMP,
        CONSTRAINT "PK_9ef4f80319e773cf60e9a0a8e285" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be0e" UNIQUE ("email")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_97672ac88f789774dd47f7c8be0e" ON "users" ("email") `
    );
    await queryRunner.query(`CREATE INDEX "IDX_user_role" ON "users" ("role") `);

    // VoterRegistration table
    await queryRunner.query(`
      CREATE TABLE "voter_registration" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "voterIdNumber" character varying(50),
        "registrationDate" date NOT NULL,
        "isEligible" boolean NOT NULL DEFAULT true,
        "eligibilityVerifiedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_8651dce2d6e70ea5e7c7a006e5f" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_c6e95f8f0e0c8e6c8f0e0c8e6c8" UNIQUE ("voterIdNumber"),
        CONSTRAINT "FK_voter_reg_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_voter_reg_user" ON "voter_registration" ("user_id") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_voter_id_number" ON "voter_registration" ("voterIdNumber") `
    );

    // Sessions table
    await queryRunner.query(`
      CREATE TABLE "sessions" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "refreshTokenHash" character varying(255) NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "ipAddress" inet,
        "userAgent" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_3238ef393458d7d8951f0c8bea" PRIMARY KEY ("id"),
        CONSTRAINT "FK_sessions_users" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_session_user_expires" ON "sessions" ("user_id", "expiresAt") `
    );

    // AuditLogs table
    await queryRunner.query(`
      CREATE TABLE "audit_logs" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "action_by_user_id" uuid,
        "actionType" character varying(100) NOT NULL,
        "resourceType" character varying(50),
        "resourceId" uuid,
        "oldValue" jsonb,
        "newValue" jsonb,
        "ipAddress" inet,
        "userAgent" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_audit_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_audit_logs_users" FOREIGN KEY ("action_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_user_created" ON "audit_logs" ("action_by_user_id", "createdAt") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_audit_action_type" ON "audit_logs" ("actionType") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "voter_registration"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_role_enum"`);
  }
}
