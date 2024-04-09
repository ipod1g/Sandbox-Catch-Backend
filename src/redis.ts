import { createClient } from "redis";

export const expirationTime = 60 * 60 * 24; // NOTE: used 1 day to limit my cache usage (using free plan)

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", function (err) {
  // throw err;
  console.error(err);
});

redisClient.connect().then(() => {
  console.log("Connected to Redis");
});

export default redisClient;
