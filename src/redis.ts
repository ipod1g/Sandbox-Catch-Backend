import { createClient } from "redis";

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
