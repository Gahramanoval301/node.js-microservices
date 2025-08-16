const Search = require("../models/Search");
const logger = require("../utils/logger");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types; 
//
// {
//   postId: '68a0668c93f7abb8669d0af6',
//   userId: '687be7064ce236ed1e2dc874',
//   content: 'Search service bir milyon ',
//   createdAt: '2025-08-16T11:07:56.119Z'
// }
async function handlePostCreated(event) {
  try {
    const newSearchPost = new Search({
      postId: event.postId,
      userId: event.userId,
      content: event.content,
      createdAt: event.createdAt,
    });

    await newSearchPost.save();
    logger.info(
      `Search post created: ${event.postId}, ${newSearchPost._id.toString()}`
    );
  } catch (e) {
    logger.error(e, "Error handling post creation event");
  }
}

async function handlePostDeleted(event) {
  try {
    const postIdObjectId = new ObjectId(event.postId);
    await Search.findByIdAndDelete(postIdObjectId);
    logger.info(`Search post deleted: ${event.postId}`);
  } catch (e) {
    logger.error(e, "Error handling post deletion event");
  }
}
module.exports = {
  handlePostCreated,
  handlePostDeleted,
};
