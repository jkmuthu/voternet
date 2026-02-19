import { MigrationInterface, QueryRunner } from 'typeorm';

export class Phase2ElectionsVotingCivicFeed1708200000000 implements MigrationInterface {
  name = 'Phase2ElectionsVotingCivicFeed1708200000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums
    await queryRunner.query(`
      CREATE TYPE "public"."election_type_enum" AS ENUM(
        'national', 'state', 'local', 'referendum', 'primary'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."election_status_enum" AS ENUM(
        'draft', 'published', 'active', 'completed', 'cancelled'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."party_affiliation_enum" AS ENUM(
        'independent', 'democratic', 'republican', 'green', 'libertarian', 'other'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."post_type_enum" AS ENUM(
        'announcement', 'policy', 'event', 'update', 'debate'
      )
    `);

    // Create elections table
    await queryRunner.query(`
      CREATE TABLE "elections" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(200) NOT NULL,
        "description" text NOT NULL,
        "electionType" "public"."election_type_enum" NOT NULL DEFAULT 'local',
        "status" "public"."election_status_enum" NOT NULL DEFAULT 'draft',
        "startDate" TIMESTAMP NOT NULL,
        "endDate" TIMESTAMP NOT NULL,
        "jurisdiction" character varying(100),
        "requiresVerification" boolean NOT NULL DEFAULT true,
        "allowsAbsenteeVoting" boolean NOT NULL DEFAULT false,
        "created_by_user_id" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_elections" PRIMARY KEY ("id"),
        CONSTRAINT "FK_elections_created_by" FOREIGN KEY ("created_by_user_id") 
          REFERENCES "users"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_election_status_start" ON "elections" ("status", "startDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_election_type_status" ON "elections" ("electionType", "status")`);

    // Create candidates table
    await queryRunner.query(`
      CREATE TABLE "candidates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_id" uuid NOT NULL,
        "election_id" uuid NOT NULL,
        "candidateName" character varying(200) NOT NULL,
        "partyAffiliation" "public"."party_affiliation_enum" NOT NULL DEFAULT 'independent',
        "bio" text,
        "platform" text,
        "website" character varying(255),
        "isActive" boolean NOT NULL DEFAULT true,
        "isVerified" boolean NOT NULL DEFAULT false,
        "verifiedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_candidates" PRIMARY KEY ("id"),
        CONSTRAINT "FK_candidates_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_candidates_election" FOREIGN KEY ("election_id") 
          REFERENCES "elections"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_candidate_election_user" ON "candidates" ("election_id", "user_id")`);

    // Create votes table
    await queryRunner.query(`
      CREATE TABLE "votes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "election_id" uuid NOT NULL,
        "voter_id" uuid NOT NULL,
        "candidate_id" uuid NOT NULL,
        "voteHash" character varying(255) NOT NULL,
        "ipAddress" inet,
        "isValid" boolean NOT NULL DEFAULT true,
        "verifiedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_votes" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_election_voter" UNIQUE ("election_id", "voter_id"),
        CONSTRAINT "FK_votes_election" FOREIGN KEY ("election_id") 
          REFERENCES "elections"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_votes_voter" FOREIGN KEY ("voter_id") 
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_votes_candidate" FOREIGN KEY ("candidate_id") 
          REFERENCES "candidates"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_votes_election_created" ON "votes" ("election_id", "createdAt")`);

    // Create campaign_posts table
    await queryRunner.query(`
      CREATE TABLE "campaign_posts" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "title" character varying(300) NOT NULL,
        "content" text NOT NULL,
        "postType" "public"."post_type_enum" NOT NULL DEFAULT 'update',
        "author_id" uuid NOT NULL,
        "election_id" uuid,
        "isPublished" boolean NOT NULL DEFAULT true,
        "likesCount" integer NOT NULL DEFAULT 0,
        "commentsCount" integer NOT NULL DEFAULT 0,
        "sharesCount" integer NOT NULL DEFAULT 0,
        "tags" jsonb,
        "imageUrl" character varying(500),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_campaign_posts" PRIMARY KEY ("id"),
        CONSTRAINT "FK_posts_author" FOREIGN KEY ("author_id") 
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_posts_election" FOREIGN KEY ("election_id") 
          REFERENCES "elections"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_posts_author_created" ON "campaign_posts" ("author_id", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_posts_election_created" ON "campaign_posts" ("election_id", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_posts_type_published" ON "campaign_posts" ("postType", "isPublished")`);

    // Create comments table
    await queryRunner.query(`
      CREATE TABLE "comments" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "content" text NOT NULL,
        "author_id" uuid NOT NULL,
        "post_id" uuid NOT NULL,
        "parent_comment_id" uuid,
        "likesCount" integer NOT NULL DEFAULT 0,
        "isVisible" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_comments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_comments_author" FOREIGN KEY ("author_id") 
          REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_post" FOREIGN KEY ("post_id") 
          REFERENCES "campaign_posts"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_comments_parent" FOREIGN KEY ("parent_comment_id") 
          REFERENCES "comments"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_comments_post_created" ON "comments" ("post_id", "createdAt")`);
    await queryRunner.query(`CREATE INDEX "IDX_comments_author_created" ON "comments" ("author_id", "createdAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "comments"`);
    await queryRunner.query(`DROP TABLE "campaign_posts"`);
    await queryRunner.query(`DROP TABLE "votes"`);
    await queryRunner.query(`DROP TABLE "candidates"`);
    await queryRunner.query(`DROP TABLE "elections"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."post_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."party_affiliation_enum"`);
    await queryRunner.query(`DROP TYPE "public"."election_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."election_type_enum"`);
  }
}
