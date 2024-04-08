import { Router } from "express";
import leaderboardRoutes from "./routes/leaderboardRoutes";

const v1 = Router();

v1.use("/leaderboard", leaderboardRoutes);

export default v1;
