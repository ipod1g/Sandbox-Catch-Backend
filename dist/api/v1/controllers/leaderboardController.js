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
exports.getProximityUsers = exports.getRank = exports.insertToLeaderboard = exports.getLeaderBoard = void 0;
const db_1 = __importDefault(require("../../../db"));
const redis_1 = __importDefault(require("../../../redis"));
const schema_1 = require("../schema");
function getLeaderBoard(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Getting leaderboard data");
        const range = Number(req.query.range) || 100;
        try {
            const cache = yield redis_1.default.zRangeWithScores("leaderboard", 0, range, {
                REV: true,
            });
            if (cache && cache.length > 0) {
                const data = cache.map((item) => {
                    return {
                        player: item.value,
                        score: item.score,
                    };
                });
                return res.status(200).json({ data });
            }
            else {
                const data = yield db_1.default.query.leaderboard.findMany({
                    orderBy: (user, { desc }) => [desc(user.score)],
                    limit: 100,
                    columns: {
                        player: true,
                        score: true,
                    },
                });
                return res.status(200).json({ data });
            }
        }
        catch (error) {
            console.error("Failed to retrieve data:", error);
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
        try {
            const data = yield db_1.default.insert(schema_1.leaderboard).values(payload).returning();
            return res.status(200).json({ data });
        }
        catch (error) {
            console.error("Failed to insert data:", error);
            return res.status(500).json({ error });
        }
    });
}
exports.insertToLeaderboard = insertToLeaderboard;
function getRank(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Getting user rank", req.body);
        try {
            const rank = yield redis_1.default.zRevRank("leaderboard", req.query.player);
            if (rank) {
                const data = {
                    rank: rank,
                    player: req.query.player,
                    score: req.query.score,
                };
                return res.status(200).json({ data });
            }
            else {
                const dbData = yield db_1.default.select().from(schema_1.leaderboard);
                const formattedData = dbData.map((item) => {
                    return {
                        score: item.score,
                        value: item.player,
                    };
                });
                yield redis_1.default.zAdd("leaderboard", formattedData);
                const expirationTime = 60 * 30; // NOTE: used 30 mins to limit my cache usage (using free plan)
                yield redis_1.default.expire("leaderboard", expirationTime);
                const rank = yield redis_1.default.zRevRank("leaderboard", req.query.player);
                if (!rank) {
                    return res.status(404).json({ error: "User not found" });
                }
                const data = {
                    rank,
                    player: req.query.player,
                    score: req.query.score,
                };
                return res.status(200).json({ data });
            }
        }
        catch (error) {
            console.error("Failed to retrieve ranks:", error);
            return res.status(500).json({ error });
        }
    });
}
exports.getRank = getRank;
// NOTE: not being used atm
const getProximityUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Getting proximity users for: ", req.query.player);
    try {
        const myRank = yield redis_1.default.zRevRank("leaderboard", req.query.player);
        if (myRank) {
            console.log("Cache found");
            const cache = yield redis_1.default.zRangeWithScores("leaderboard", myRank - 5, myRank + 5, {
                REV: true,
            });
            const data = cache.map((item) => ({
                player: item.value,
                score: item.score,
                myRank: myRank,
            }));
            return res.status(200).json({ data });
        }
        else {
            console.log("Cache missing");
            const dbData = yield db_1.default.select().from(schema_1.leaderboard);
            const formattedData = dbData.map((item) => {
                return {
                    score: item.score,
                    value: item.player,
                };
            });
            yield redis_1.default.zAdd("leaderboard", formattedData);
            const expirationTime = 60 * 30; // 30 mins to limit my cache usage (using free plan)
            yield redis_1.default.expire("leaderboard", expirationTime);
            const myRank = yield redis_1.default.zRevRank("leaderboard", req.query.player);
            if (!myRank) {
                return res.status(404).json({ error: "User not found" });
            }
            const cache = yield redis_1.default.zRangeWithScores("leaderboard", myRank - 5, myRank + 5, {
                REV: true,
            });
            const data = cache.map((item) => ({
                player: item.value,
                score: item.score,
                myRank: myRank,
            }));
            return res.status(200).json({ data });
        }
    }
    catch (error) {
        console.error("Failed to retrieve ranks:", error);
        return res.status(500).json({ error });
    }
});
exports.getProximityUsers = getProximityUsers;
//# sourceMappingURL=leaderboardController.js.map