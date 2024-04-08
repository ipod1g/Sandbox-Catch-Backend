"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboardController_1 = require("../controllers/leaderboardController");
const leaderboardRoutes = (0, express_1.Router)();
leaderboardRoutes.get("/", leaderboardController_1.getLeaderBoard).post("/", leaderboardController_1.insertToLeaderboard);
leaderboardRoutes.get("/rank", leaderboardController_1.getRank);
leaderboardRoutes.get("/proximity", leaderboardController_1.getProximityUsers);
exports.default = leaderboardRoutes;
//# sourceMappingURL=leaderboardRoutes.js.map