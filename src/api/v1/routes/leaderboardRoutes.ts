import { Router } from "express";
import {
  getLeaderBoard,
  insertToLeaderboard,
  getRank,
} from "../controllers/leaderboardController";

const leaderboardRoutes = Router();

leaderboardRoutes.get("/", getLeaderBoard).post("/", insertToLeaderboard);

leaderboardRoutes.get("/rank", getRank);

export default leaderboardRoutes;
