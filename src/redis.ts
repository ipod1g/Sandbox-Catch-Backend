import { createClient } from "redis";

export const expirationTime = 60 * 30; // NOTE: used 30 mins to limit my cache usage (using free plan)

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient.on("error", function (err) {
  throw err;
});
redisClient.connect().then(() => {
  console.log("Connected to Redis");
});

export default redisClient;
