const redis = require("redis");
const dotenv = require("dotenv")

dotenv.config();

const host = process.env.REDIS_HOST || "localhost"

const redisClient = redis.createClient({port: 6379, host});

redisClient.on("error", (err) => {
    console.log(err)
    process.exit(1);
})

redisClient.on("connect", () => {
    console.log("Connected to Redis...")
})

module.exports = redisClient;