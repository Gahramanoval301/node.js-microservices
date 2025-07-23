const { uploadMediaToCloudinary } = require("../utils/cloudinary");
const Media = require("../models/Media");
const logger = require("../utils/logger");

const uploadMedia = async (req, res) => {
  logger.info("Starting media upload");

  try {
    console.log("request file", req.file);
    if (!req.file) {
      logger.error("No file uploaded. Please add a file and try again!");
      return res.status(400).json({
        message: "No file uploaded. Please add a file and try again!",
      });
    }

    const { originalname, size, mimetype, buffer } = req.file;
    const userId = req.user.userId;

    logger.info(
      `Received file ${originalname} of size ${size} bytes and type ${mimetype}`
    );
    logger.info("Uploading to cloudinary starting...");

    const cloudinaryUploadResult = await uploadMediaToCloudinary(req.file);

    logger.info(
      "Uploading to cloudinary completed successfully. Public id: ",
      cloudinaryUploadResult.public_id
    );

    const newlyCreatedMedia = await Media({
      publicId: cloudinaryUploadResult.public_id,
      originalName: originalname,
      mimeType: mimetype,
      url: cloudinaryUploadResult.secure_url,
      userId,
    });

    await newlyCreatedMedia.save();

    res.status(201).json({
      message: "Media uploaded successfully",
      mediaId: newlyCreatedMedia._id,
      url: newlyCreatedMedia.url,
      message: "Media uploaded successfully",
    });
  } catch (error) {
    logger.error("Error while uploading media", error);
    res.status(500).json({ message: "Error while uploading media", error });
  }
};

const getAllMedias = async (req, res) => {
  try {

    const results = await Media.find({});

    res.json({results})
  } catch (error) {
    logger.error("Error fetching medias", error);
    res.status(500).json({ message: "Error fetching medias", error });
  }
};

module.exports = { uploadMedia, getAllMedias };
