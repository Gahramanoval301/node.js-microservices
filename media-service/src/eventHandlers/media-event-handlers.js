const Media = require("../models/Media");
const { deleteMediaFromCloudinary } = require("../utils/cloudinary");

const handlePostDeleted = async (event) => {
  //     event ->
  //   postId: '688121d2088d42d9b8709a1a',
  //   userId: '687be7064ce236ed1e2dc874',
  //   mediaIds: [ '688121a05967ed111a73aa9c' ]
  //   console.log(event, "eventevent");

  //it will not only post, delete media from cloudinary, and delete fetch images api
  const { postId, userId, mediaIds } = event;
  //just deketion from database and mongodb
  try {
    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });
    console.log("mediaToDelete", mediaToDelete, mediaIds);
    for (const media of mediaToDelete) {
      console.log("1lemannnnnnnnnnnnnnnnnnnnnnnnnnnnnn", media);

      //delete from cloudinary
      await deleteMediaFromCloudinary(media.publicId);

      //delete from monngo db database
      await Media.findByIdAndDelete(media._id);
      console.log("media delete");

      logger.info(
        `Deleted media {some media id} associated with this deleted post ${postId}`
      );
    }
    logger.info(`process deletion of media for post id ${postId}`);
  } catch (error) {
    logger.error(error, "error on handle post deleted while media deletion");
  }
};

module.exports = { handlePostDeleted };
