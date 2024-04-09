"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expirationTime = void 0;
const redis_1 = require("redis");
exports.expirationTime = 60 * 30; // NOTE: used 30 mins to limit my cache usage (using free plan)
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
});
redisClient.on("error", function (err) {
    // throw err;
    console.error(err);
});
redisClient.connect().then(() => {
    console.log("Connected to Redis");
});
exports.default = redisClient;
//# sourceMappingURL=redis.js.map