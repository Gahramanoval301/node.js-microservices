const express = require("express");
const multer = require("multer");

const { uploadMedia, getAllMedias } = require("../controllers/media-controller");
const { authenticateRequest } = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

const router = express.Router();

//configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
}).single("file");

router.post("/upload", authenticateRequest, (req, res, next) => {
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
}, uploadMedia);
    
router.get("/get", authenticateRequest, getAllMedias)
module.exports = router;