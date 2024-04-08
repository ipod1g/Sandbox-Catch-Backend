import {
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const leaderboard = pgTable(
  "leaderboard",
  {
    id: serial("id").primaryKey(),
    player: varchar("player", { length: 256 }).default("Unknown"),
    score: integer("score").notNull().default(0),
    createdTime: timestamp("createdTime").defaultNow(),
  },
  (table) => {
    return {
      scoreIdx: index("score_idx").on(table.score),
    };
  }
);

export type Leaderboard = typeof leaderboard;
