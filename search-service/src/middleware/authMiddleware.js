const logger = require("../utils/logger");

const authenticateRequest = (req, res, next) => {
  const userId = req.headers["x-user-id"];

  if (!userId) {
    logger.warn("Access attempted without user ID");

    res.status(401).json({
      success: false,
      message: "Access denied. Please provide a valid user ID or login",
    });
  }
  req.user = { userId };
  next();
};

module.exports = { authenticateRequest };
