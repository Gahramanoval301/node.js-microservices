require("dotenv").config();

const mongoose = require("mongoose");
const logger = require("./utils/logger");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/identity-service");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3001;

//connect to mongodb - bookstore api 
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.info("Connected to the mongo db"))
  .catch((e) => logger.error("Mongo conenction error: ", e));

const redisClient = new Redis(process.env.REDIS_URL);

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

//redis client

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body,  ${req.body}`);
  next();
});

//DDos protection and rate limiting

//you can make 10 requests per 1 second
const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient, // // Redis client instance
  keyPrefix: "middleware", // // Optional prefix for Redis keys
  points: 10, // Max 10 requests...
  duration: 1, // ...per 1 second (per IP)
});

app.use((req, res, next) => {
  rateLimiter
    .consume(req.ip)
    .then(() => next())
    .catch(() => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip} `);

      res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    });
});

// IP based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
  heandler: (req, res) => {
    logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      success: false,
      message: "Too many requests",
    });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

//apply this sensitiveEndpointsLimiter to out routes
app.use("/api/auth/register", sensitiveEndpointsLimiter);

// Routes
app.use("/api/auth", routes);

//error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Identity service running on port ${PORT}`);
});

//undhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason: ", reason);
});
