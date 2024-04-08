CREATE TABLE IF NOT EXISTS "leaderboard" (
	"id" serial PRIMARY KEY NOT NULL,
	"player" varchar(256) DEFAULT 'Unknown',
	"score" integer DEFAULT 0 NOT NULL,
	"createdTime" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "score_idx" ON "leaderboard" ("score");