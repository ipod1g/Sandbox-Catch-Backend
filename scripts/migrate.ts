import { migrate } from "drizzle-orm/postgres-js/migrator";
import db from "../src/db";

export const migrateDB = async () => {
  console.log("migrating db");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("db migrated");
  process.exit(0);
};

migrateDB();
