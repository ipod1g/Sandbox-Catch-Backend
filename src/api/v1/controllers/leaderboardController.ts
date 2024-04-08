import db from "../../../db";
import redisClient from "../../../redis";
import { leaderboard } from "../schema";
import type { Request, Response } from "express";

export async function getLeaderBoard(req: Request, res: Response) {
  console.log("Getting leaderboard data");
  const range = Number(req.query.range) || 100;
  try {
    const cache = await redisClient.zRangeWithScores("leaderboard", 0, range, {
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
    } else {
      const data = await db.query.leaderboard.findMany({
        orderBy: (user, { desc }) => [desc(user.score)],
        limit: 100,
        columns: {
          player: true,
          score: true,
        },
      });
      return res.status(200).json({ data });
    }
  } catch (error) {
    console.error("Failed to retrieve data:", error);
  }
}

export async function insertToLeaderboard(req: Request, res: Response) {
  console.log("Inserting new user", req.body);
  const payload = {
    player: req.body.player,
    score: req.body.score,
  };
  try {
    const data = await db.insert(leaderboard).values(payload).returning();
    return res.status(200).json({ data });
  } catch (error) {
    console.error("Failed to insert data:", error);
    return res.status(500).json({ error });
  }
}

export async function getRank(req: Request, res: Response) {
  console.log("Getting user rank", req.query.player as string);
  try {
    if (!req.query.player) {
      return res.status(400).json({ error: "Player name is required" });
    }
    const rank = await redisClient.zRevRank(
      "leaderboard",
      req.query.player as string
    );
    if (rank) {
      const data = {
        rank: rank,
        player: req.query.player,
        score: req.query.score,
      };
      return res.status(200).json({ data });
    } else {
      const dbData = await db.select().from(leaderboard);
      const formattedData = dbData.map((item) => {
        return {
          score: item.score,
          value: item.player as string,
        };
      });
      await redisClient.zAdd("leaderboard", formattedData);
      const expirationTime = 60 * 30; // NOTE: used 30 mins to limit my cache usage (using free plan)

      await redisClient.expire("leaderboard", expirationTime);
      const rank = await redisClient.zRevRank(
        "leaderboard",
        req.query.player as string
      );

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
  } catch (error) {
    console.error("Failed to retrieve ranks:", error);
    return res.status(500).json({ error });
  }
}

// NOTE: not being used atm
export const getProximityUsers = async (req: Request, res: Response) => {
  console.log("Getting proximity users for: ", req.query.player);
  try {
    const myRank = await redisClient.zRevRank(
      "leaderboard",
      req.query.player as string
    );
    if (myRank) {
      console.log("Cache found");
      const cache = await redisClient.zRangeWithScores(
        "leaderboard",
        myRank - 5,
        myRank + 5,
        {
          REV: true,
        }
      );

      const data = cache.map((item) => ({
        player: item.value,
        score: item.score,
        myRank: myRank,
      }));
      return res.status(200).json({ data });
    } else {
      console.log("Cache missing");
      const dbData = await db.select().from(leaderboard);
      const formattedData = dbData.map((item) => {
        return {
          score: item.score,
          value: item.player as string,
        };
      });
      await redisClient.zAdd("leaderboard", formattedData);
      const expirationTime = 60 * 30; // 30 mins to limit my cache usage (using free plan)

      await redisClient.expire("leaderboard", expirationTime);
      const myRank = await redisClient.zRevRank(
        "leaderboard",
        req.query.player as string
      );

      if (!myRank) {
        return res.status(404).json({ error: "User not found" });
      }

      const cache = await redisClient.zRangeWithScores(
        "leaderboard",
        myRank - 5,
        myRank + 5,
        {
          REV: true,
        }
      );

      const data = cache.map((item) => ({
        player: item.value,
        score: item.score,
        myRank: myRank,
      }));

      return res.status(200).json({ data });
    }
  } catch (error) {
    console.error("Failed to retrieve ranks:", error);
    return res.status(500).json({ error });
  }
};
