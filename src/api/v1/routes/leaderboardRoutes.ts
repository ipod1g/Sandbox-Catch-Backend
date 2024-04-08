import { Router } from "express";
import {
  getLeaderBoard,
  getProximityUsers,
  insertToLeaderboard,
  getRank,
} from "../controllers/leaderboardController";

const leaderboardRoutes = Router();

leaderboardRoutes.get("/", getLeaderBoard).post("/", insertToLeaderboard);

leaderboardRoutes.get("/rank", getRank);

leaderboardRoutes.get("/proximity", getProximityUsers);

export default leaderboardRoutes;
