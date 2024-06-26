import db from "../../../db";
import redisClient, { expirationTime } from "../../../redis";
import { leaderboard } from "../schema";
import type { NextFunction, Request, Response } from "express";

export async function getLeaderBoard(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("Getting leaderboard data");
  const range = Number(req.query.range) || 100;
  try {
    const dbData = await db.query.leaderboard.findMany({
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
    } else {
      return res.status(404).json({ error: "No data found." });
    }
  } catch (error) {
    console.error("Failed to retrieve data:", error);
    return res.status(500).json({ error });
  }
}

export async function insertToLeaderboard(req: Request, res: Response) {
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

  db.transaction(async (trx) => {
    try {
      const data = await trx.insert(leaderboard).values(payload).returning();
      // If cache append fails, it will rollback the db append too
      await redisClient.zAdd("leaderboard", {
        score: data[0].score,
        value: `userid:${data[0].id}`,
      });
      return res.status(201).json({ data });
    } catch (error) {
      trx.rollback();
      console.error("Failed to insert data properly:", error);
      return res.status(500).json("Internal Server Error.");
    }
  });
}

export async function getPlayer(req: Request, res: Response) {
  const id = req.params.id;

  if (!id) return res.status(400).json({ error: "Player ID required." });

  console.log("Getting user rank:", id);

  try {
    const rank = await redisClient.zRevRank("leaderboard", `userid:${id}`);
    if (rank !== null) {
      console.debug("Cache hit");

      const data = {
        rank: rank + 1,
      };
      return res.status(200).json({ data });
    } else {
      console.debug("Cache Miss");
      // query without limit since we need to find the rank of the user (can be +100)
      const dbData = await db.select().from(leaderboard);
      const formattedData = dbData.map((datum) => {
        return {
          score: datum.score,
          value: `userid:${datum.id}`,
        };
      });
      // Heavy operation that happens if cache miss - (maybe consider Pareto's Law?)
      await redisClient.zAdd("leaderboard", formattedData);
      // await redisClient.expire("leaderboard", expirationTime);
      const rank = await redisClient.zRevRank("leaderboard", `userid:${id}`);

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
  } catch (error) {
    console.error("Failed to retrieve ranks:", error);
    return res.status(500).json("Internal Server Error.");
  }
}
