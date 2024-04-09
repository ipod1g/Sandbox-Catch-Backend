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
exports.getPlayer = exports.insertToLeaderboard = exports.getLeaderBoard = void 0;
const db_1 = __importDefault(require("../../../db"));
const redis_1 = __importStar(require("../../../redis"));
const schema_1 = require("../schema");
function getLeaderBoard(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Getting leaderboard data");
        const range = Number(req.query.range) - 1 || 99;
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
                return res.status(404).json({ error: "No data found" });
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
        try {
            const data = yield db_1.default.insert(schema_1.leaderboard).values(payload).returning();
            if (redis_1.default.isReady) {
                yield redis_1.default.zAdd("leaderboard", {
                    score: data[0].score,
                    value: `userid:${data[0].id}`,
                });
            }
            return res.status(201).json({ data });
        }
        catch (error) {
            console.error("Failed to insert data properly:", error);
            return res.status(500).json("Internal Server Error");
        }
    });
}
exports.insertToLeaderboard = insertToLeaderboard;
function getPlayer(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.params.id)
            return res.status(400).json({ error: "Player id required" });
        const { id } = req.params;
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
                // Heavy operation that happens if cache expires
                yield redis_1.default.zAdd("leaderboard", formattedData);
                yield redis_1.default.expire("leaderboard", redis_1.expirationTime);
                const rank = yield redis_1.default.zRevRank("leaderboard", `userid:${id}`);
                if (rank === null) {
                    return res.status(404).json({ error: "User not found" });
                }
                const data = {
                    rank: rank + 1,
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
exports.getPlayer = getPlayer;
//# sourceMappingURL=leaderboardController.js.map