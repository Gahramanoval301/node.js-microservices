const logger = require("../utils/logger");

export const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      logger.error("Multer error during file upload:", err);
      return res.status(400).json({
        message: "File upload failed",
        error: err.message,
        stack: err.stack,
      });
    } else if (err) {
      logger.error("Unknown error during file upload:", err);
      return res
        .status(500)
        .json({ message: "Unknown upload error", error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }
    next();
  });
};
