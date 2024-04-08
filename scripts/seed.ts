import "dotenv/config";
import { faker } from "@faker-js/faker";
import * as schema from "../src/api/v1/schema";
import db from "../src/db";

const NUM_OF_GENERATED_ENTRIES = 10;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

const generateRandomEntries = (
  count: number
): { player: string; score: number }[] => {
  const entries: { player: string; score: number }[] = [];
  for (let i = 0; i < count; i++) {
    const entry = {
      player: faker.person.lastName(),
      score: faker.number.int({ min: -10, max: 10 }) * 50,
    };
    entries.push(entry);
  }
  return entries;
};

const main = async () => {
  try {
    await db.delete(schema.leaderboard);
    const entries = generateRandomEntries(NUM_OF_GENERATED_ENTRIES);
    await db.insert(schema.leaderboard).values(entries).returning();
    console.log(`Seeded the database with ${NUM_OF_GENERATED_ENTRIES} entries`);
  } catch (error) {
    console.error("Failed to seed the database:", error);
  }
  process.exit(0);
};

main();
