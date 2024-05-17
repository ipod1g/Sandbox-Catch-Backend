"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlayer = exports.insertToLeaderboard = exports.getLeaderBoard = void 0;
const db_1 = __importDefault(require("../../../db"));
const redis_1 = __importDefault(require("../../../redis"));
const schema_1 = require("../schema");
function getLeaderBoard(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Getting leaderboard data");
        const range = Number(req.query.range) || 100;
        try {
            const dbData = yield db_1.default.query.leaderboard.findMany({
                orderBy: (user, { desc }) => [desc(user.score), desc(user.createdTime)],
                limit: range,
                columns: {
                    id: true,
                    player: true,
                    score: true,
                },
            });
            if (dbData && dbData.length > 0) {
                const leaderboardArr = dbData.map((item, index) => ({
                    id: item.id,
                    rank: index + 1,
                    score: item.score,
                    player: item.player,
                }));
                return res.status(200).json({ data: leaderboardArr });
            }
            else {
                return res.status(404).json({ error: "No data found." });
            }
        }
        catch (error) {
            console.error("Failed to retrieve data:", error);
            return res.status(500).json({ error });
        }
    });
}
exports.getLeaderBoard = getLeaderBoard;
function insertToLeaderboard(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Inserting new user", req.body);
        const payload = {
            player: req.body.player,
            score: req.body.score,
        };
        if (typeof payload.score !== "number") {
            return res
                .status(400)
                .json({ error: "Invalid score. Score must be a number." });
        }
        db_1.default.transaction((trx) => __awaiter(this, void 0, void 0, function* () {
            try {
                const data = yield trx.insert(schema_1.leaderboard).values(payload).returning();
                // If cache append fails, it will rollback the db append too
                yield redis_1.default.zAdd("leaderboard", {
                    score: data[0].score,
                    value: `userid:${data[0].id}`,
                });
                return res.status(201).json({ data });
            }
            catch (error) {
                trx.rollback();
                console.error("Failed to insert data properly:", error);
                return res.status(500).json("Internal Server Error.");
            }
        }));
    });
}
exports.insertToLeaderboard = insertToLeaderboard;
function getPlayer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = req.params.id;
        if (!id)
            return res.status(400).json({ error: "Player ID required." });
        console.log("Getting user rank:", id);
        try {
            const rank = yield redis_1.default.zRevRank("leaderboard", `userid:${id}`);
            if (rank !== null) {
                console.debug("Cache hit");
                const data = {
                    rank: rank + 1,
                };
                return res.status(200).json({ data });
            }
            else {
                console.debug("Cache Miss");
                // query without limit since we need to find the rank of the user (can be +100)
                const dbData = yield db_1.default.select().from(schema_1.leaderboard);
                const formattedData = dbData.map((datum) => {
                    return {
                        score: datum.score,
                        value: `userid:${datum.id}`,
                    };
                });
                // Heavy operation that happens if cache miss - (maybe consider Pareto's Law?)
                yield redis_1.default.zAdd("leaderboard", formattedData);
                // await redisClient.expire("leaderboard", expirationTime);
                const rank = yield redis_1.default.zRevRank("leaderboard", `userid:${id}`);
                if (rank === null) {
                    return res
                        .status(404)
                        .json({ error: `Player with ID '${id}' not found.` });
                }
                const data = {
                    rank: rank + 1,
                };
                return res.status(200).json({ data });
            }
        }
        catch (error) {
            console.error("Failed to retrieve ranks:", error);
            return res.status(500).json("Internal Server Error.");
        }
    });
}
exports.getPlayer = getPlayer;
//# sourceMappingURL=leaderboardController.js.map