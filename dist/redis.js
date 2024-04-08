"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("redis");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
});
redisClient.on("error", function (err) {
    throw err;
});
redisClient.connect().then(() => {
    console.log("Connected to Redis");
});
exports.default = redisClient;
//# sourceMappingURL=redis.js.map