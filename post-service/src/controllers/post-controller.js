const logger = require("../utils/logger");
const Post = require("../models/Post");
const { validateCreatePost } = require("../utils/validation");
const { invalidatePostCache } = require("../utils/invalidateCache");
const { publishEvent } = require("../utils/rabbitmq");

const createPost = async (req, res) => {
  logger.info("Create post endpoint hit");
  try {
    //validate the schema
    const { error } = validateCreatePost(req.body);
    if (error) {
      logger.warn("Validation error", error.details[0].message);

      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;
    const newlyCreatedPost = await Post.create({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();

    await publishEvent("post.created", {
      postId: newlyCreatedPost._id.toString(),
      userId: newlyCreatedPost.user.toString(),
      content: newlyCreatedPost.content,
      createdAt: newlyCreatedPost.createdAt,
    })

    await invalidatePostCache(req, newlyCreatedPost._id.toString());

    logger.info("Post created successfully", newlyCreatedPost);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (e) {
    logger.error("Error creating post", e);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};
const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:${page}:${limit}`;
    const cachedPosts = await req.redisClient.get(cacheKey);

    if (cachedPosts) {
      return res.json(JSON.parse(cachedPosts));
    }
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);
    const totalPosts = await Post.countDocuments({});

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    };

    //save your posts in redis cache - 5min
    await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

    res.json(result);
  } catch (e) {
    logger.error("Error fetching posts", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};
const getPost = async (req, res) => {
  try {
    const postId = req.params.id;
    const cacheKey = `post:${postId}`;
    const cachedPost = await req.redisClient.get(cacheKey);

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }

    const postDetailsById = await Post.findById(postId);

    if (!postDetailsById) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    //save your post in redis cache - 1hr
    await req.redisClient.setex(
      cacheKey,
      3600,
      JSON.stringify(postDetailsById)
    );
    // await req.redisClient.setex(cachedPost, 3600, JSON.stringify(postDetailsById));

    res.json(postDetailsById);
  } catch (e) {
    logger.error("Error fetching post", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post by ID",
    });
  }
};
const deletePost = async (req, res) => {
  try {
    const postId = req.params.id;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "Post ID is required",
      });
    }

    const post = await Post.findByIdAndDelete({
      _id: postId,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }
    
    //publist post delete method
    await publishEvent("post.deleted", {
      postId: post._id.toString(),
      userId: req.user.userId.toString(),
      mediaIds: post.mediaIds,
    });
    
    await invalidatePostCache(req, postId);

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (e) {
    logger.error("Error deleting post", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post by ID",
    });
  }
};

module.exports = { createPost, getAllPosts, getPost, deletePost };
