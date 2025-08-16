require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");

const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const searchRoutes = require("./routes/search-routes");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./eventHandlers/search-event-handlers");

const app = express();
const PORT = process.env.PORT || 3004;

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

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body,  ${req.body}`);
  next();
});

// IP based rate limiting for sensitive endpoints
// const sensitiveEndpointsLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 50,
//   standardHeaders: true,
//   legacyHeaders: false,
//   heandler: (req, res) => {
//     logger.warn(`Sensitive endpoint rate limit exceeded for IP: ${req.ip}`);
//     res.status(429).json({
//       success: false,
//       message: "Too many requests",
//     });
//   },
//   store: new RedisStore({
//     sendCommand: (...args) => redisClient.call(...args),
//   }),
// });

//routes -> pass redisClient to routes

//TODO: implement redis caching
app.use("/api/search", searchRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    await connectToRabbitMQ();

    //consume the events / subscribe to the events
    await consumeEvent("post.created", handlePostCreated);
    await consumeEvent("post.deleted", handlePostDeleted);

    app.listen(PORT, ()=>{
      logger.info(`search service started on port: ${PORT}`);
    })
  } catch (e) {
    logger.error(e, "Fail to start search service");
    process.exit(1);
  }
}

startServer();
