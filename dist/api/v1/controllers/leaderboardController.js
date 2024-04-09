"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.getRank = exports.insertToLeaderboard = exports.getLeaderBoard = void 0;
const db_1 = __importDefault(require("../../../db"));
const redis_1 = __importStar(require("../../../redis"));
const schema_1 = require("../schema");
function getLeaderBoard(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Getting leaderboard data");
        const range = Number(req.query.range) - 1 || 99;
        try {
            if (!redis_1.default.isReady) {
                console.log("Redis connection failed");
                const dbData = yield db_1.default.query.leaderboard.findMany({
                    orderBy: (user, { desc }) => [desc(user.score)],
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
                    return res.status(404).json({ error: "No data found" });
                }
            }
            // if connected to redis
            const sortedSet = yield redis_1.default.zRangeWithScores("leaderboard", 0, range, {
                REV: true,
            });
            if (sortedSet && sortedSet.length > 0) {
                console.log("Cache hit");
                let leaderboardArr = new Array(sortedSet.length);
                let fetchedUserCount = 0;
                for (let i = 0; i < sortedSet.length; i++) {
                    const hashData = yield redis_1.default.hmGet("users", sortedSet[i].value);
                    if (hashData) {
                        const details = {
                            id: sortedSet[i].value.split(":")[1],
                            rank: i + 1,
                            score: sortedSet[i].score,
                            player: JSON.parse(hashData[0]).player,
                            country: JSON.parse(hashData[0]).country,
                        };
                        leaderboardArr[i] = details;
                        fetchedUserCount++;
                        if (fetchedUserCount == sortedSet.length) {
                            return res.status(200).json({ data: leaderboardArr });
                        }
                    }
                    else {
                        next(new Error("Failed to retrieve data"));
                    }
                }
            }
            else {
                const dbData = yield db_1.default.query.leaderboard.findMany({
                    orderBy: (user, { desc }) => [desc(user.score)],
                    limit: range,
                    columns: {
                        id: true,
                        player: true,
                        score: true,
                    },
                });
                // update sortedSet
                if (dbData && dbData.length > 0) {
                    const formattedData = dbData.map((item) => {
                        return {
                            score: item.score,
                            value: `userid:${item.id}`,
                        };
                    });
                    yield redis_1.default.zAdd("leaderboard", formattedData);
                    yield redis_1.default.expire("leaderboard", redis_1.expirationTime);
                    const leaderboardArr = dbData.map((item, index) => ({
                        id: item.id,
                        rank: index + 1,
                        score: item.score,
                        player: item.player,
                    }));
                    // update hash table
                    dbData.forEach((datum) => __awaiter(this, void 0, void 0, function* () {
                        yield redis_1.default.hSet("users", `userid:${datum.id}`, JSON.stringify(datum));
                        yield redis_1.default.expire("users", redis_1.expirationTime);
                    }));
                    return res.status(200).json({ data: leaderboardArr });
                }
                else {
                    return res.status(404).json({ error: "No data found" });
                }
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
        try {
            const data = yield db_1.default.insert(schema_1.leaderboard).values(payload).returning();
            if (redis_1.default.isReady) {
                yield redis_1.default.zAdd("leaderboard", {
                    score: data[0].score,
                    value: `userid:${data[0].id}`,
                });
                yield redis_1.default.hSet("users", `userid:${data[0].id}`, JSON.stringify(data[0]));
            }
            return res.status(200).json({ data });
        }
        catch (error) {
            console.error("Failed to insert data properly:", error);
            return res.status(500).json({ error });
        }
    });
}
exports.insertToLeaderboard = insertToLeaderboard;
function getRank(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.query.id)
            return res.status(400).json({ error: "Player id required" });
        if (!redis_1.default.isReady) {
            return res.status(500).json({ error: "Redis connection failed" });
        }
        const { id } = req.query;
        console.log("Getting user rank:", id);
        try {
            const rank = yield redis_1.default.zRevRank("leaderboard", `userid:${req.query.id}`);
            if (typeof rank !== "undefined" && rank !== null) {
                // no need to visit hash table
                const data = {
                    rank: rank + 1,
                    player: req.query.player,
                    score: req.query.score,
                };
                return res.status(200).json({ data });
            }
            else {
                // query without limit since we need to find the rank of the user (can be +100)
                const dbData = yield db_1.default.select().from(schema_1.leaderboard);
                const formattedData = dbData.map((datum) => {
                    return {
                        score: datum.score,
                        value: `userid:${datum.id}`,
                    };
                });
                yield redis_1.default.zAdd("leaderboard", formattedData);
                const rank = yield redis_1.default.zRevRank("leaderboard", `userid:${req.query.id}`);
                if (typeof rank === "undefined" || rank === null) {
                    return res.status(404).json({ error: "User not found" });
                }
                const data = {
                    rank: rank,
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
//# sourceMappingURL=leaderboardController.js.map