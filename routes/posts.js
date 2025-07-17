const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all published posts (public)
router.get('/', async (req, res) => {
  try {
    const { category, tag, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { isPublished: true };
    if (category) query.category = category;
    if (tag) query.tags = tag;
    
    // Get posts with pagination
    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name');
    
    // Get total count for pagination
    const total = await Post.countDocuments(query);
    
    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    const post = await Post.findOne({ 
      slug: req.params.slug,
      isPublished: true 
    }).populate('author', 'name');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Increment view count
    post.viewCount += 1;
    await post.save();
    
    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new post (admin only)
router.post('/', auth, adminAuth, async (req, res) => {
  try {
    const { title, content, category, tags, featuredImage, isPublished } = req.body;
    
    const post = new Post({
      title,
      content,
      author: req.userId,
      category,
      tags: tags || [],
      featuredImage,
      isPublished: isPublished !== undefined ? isPublished : true
    });
    
    await post.save();
    
    res.status(201).json({
      message: 'Post created successfully',
      post
    });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update post (admin only)
router.put('/:id', auth, adminAuth, async (req, res) => {
  try {
    const { title, content, category, tags, featuredImage, isPublished } = req.body;
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Update fields
    if (title) post.title = title;
    if (content) post.content = content;
    if (category) post.category = category;
    if (tags) post.tags = tags;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (isPublished !== undefined) post.isPublished = isPublished;
    
    await post.save();
    
    res.json({
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post (admin only)
router.delete('/:id', auth, adminAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    await post.remove();
    
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment to post (authenticated users)
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ message: 'Comment content is required' });
    }
    
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Add comment
    post.comments.push({
      userId: req.userId,
      content
    });
    
    await post.save();
    
    // Get user info for response
    const user = await User.findById(req.userId).select('name');
    
    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        ...post.comments[post.comments.length - 1].toObject(),
        user
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete comment (comment author or admin)
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    // Find comment
    const comment = post.comments.id(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is comment author or admin
    const user = await User.findById(req.userId);
    if (comment.userId.toString() !== req.userId && user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    // Remove comment
    comment.remove();
    await post.save();
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;