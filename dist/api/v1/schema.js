"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaderboard = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.leaderboard = (0, pg_core_1.pgTable)("leaderboard", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    player: (0, pg_core_1.varchar)("player", { length: 256 }).default("Unknown"),
    score: (0, pg_core_1.integer)("score").notNull().default(0),
    createdTime: (0, pg_core_1.timestamp)("createdTime").defaultNow(),
}, (table) => {
    return {
        scoreIdx: (0, pg_core_1.index)("score_idx").on(table.score),
    };
});
//# sourceMappingURL=schema.js.map