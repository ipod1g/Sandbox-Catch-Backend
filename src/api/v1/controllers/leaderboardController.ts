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
  const range = Number(req.query.range) - 1 || 99;
  try {
    if (!redisClient.isReady) {
      console.log("Redis connection failed");

      const dbData = await db.query.leaderboard.findMany({
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
      } else {
        return res.status(404).json({ error: "No data found" });
      }
    }

    // if connected to redis
    const sortedSet = await redisClient.zRangeWithScores(
      "leaderboard",
      0,
      range,
      {
        REV: true,
      }
    );

    if (sortedSet && sortedSet.length > 0) {
      console.log("Cache hit");
      let leaderboardArr = new Array(sortedSet.length);
      let fetchedUserCount = 0;

      for (let i = 0; i < sortedSet.length; i++) {
        const hashData = await redisClient.hmGet("users", sortedSet[i].value);
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
        } else {
          next(new Error("Failed to retrieve data"));
        }
      }
    } else {
      const dbData = await db.query.leaderboard.findMany({
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
        await redisClient.zAdd("leaderboard", formattedData);
        await redisClient.expire("leaderboard", expirationTime);

        const leaderboardArr = dbData.map((item, index) => ({
          id: item.id,
          rank: index + 1,
          score: item.score,
          player: item.player,
        }));

        // update hash table
        dbData.forEach(async (datum) => {
          await redisClient.hSet(
            "users",
            `userid:${datum.id}`,
            JSON.stringify(datum)
          );
          await redisClient.expire("users", expirationTime);
        });

        return res.status(200).json({ data: leaderboardArr });
      } else {
        return res.status(404).json({ error: "No data found" });
      }
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

  try {
    const data = await db.insert(leaderboard).values(payload).returning();

    if (redisClient.isReady) {
      await redisClient.zAdd("leaderboard", {
        score: data[0].score,
        value: `userid:${data[0].id}`,
      });
      await redisClient.hSet(
        "users",
        `userid:${data[0].id}`,
        JSON.stringify(data[0])
      );
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error("Failed to insert data properly:", error);
    return res.status(500).json({ error });
  }
}

export async function getRank(req: Request, res: Response) {
  if (!req.query.id)
    return res.status(400).json({ error: "Player id required" });
  if (!redisClient.isReady) {
    return res.status(500).json({ error: "Redis connection failed" });
  }

  const { id } = req.query;
  console.log("Getting user rank:", id);

  try {
    const rank = await redisClient.zRevRank(
      "leaderboard",
      `userid:${req.query.id}`
    );
    if (typeof rank !== "undefined" && rank !== null) {
      // no need to visit hash table
      const data = {
        rank: rank + 1,
        player: req.query.player,
        score: req.query.score,
      };
      return res.status(200).json({ data });
    } else {
      // query without limit since we need to find the rank of the user (can be +100)
      const dbData = await db.select().from(leaderboard);
      const formattedData = dbData.map((datum) => {
        return {
          score: datum.score,
          value: `userid:${datum.id}`,
        };
      });
      await redisClient.zAdd("leaderboard", formattedData);
      const rank = await redisClient.zRevRank(
        "leaderboard",
        `userid:${req.query.id}`
      );

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
  } catch (error) {
    console.error("Failed to retrieve ranks:", error);
    return res.status(500).json({ error });
  }
}
