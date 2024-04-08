"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leaderboardRoutes_1 = __importDefault(require("./routes/leaderboardRoutes"));
const v1 = (0, express_1.Router)();
v1.use("/leaderboard", leaderboardRoutes_1.default);
exports.default = v1;
//# sourceMappingURL=index.js.map