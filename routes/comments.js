const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Message = require('../models/message');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// --- CREATE: Post a comment on a message ---
// @route   POST /api/comments
// @desc    Add a comment to a birthday message
// @access  Public (anonymous or logged in)
router.post('/', async (req, res) => {
  try {
    const { message_id, commenter_name, comment_text } = req.body;

    // Validate input
    if (!message_id || !comment_text) {
      return res.status(400).json({ error: 'Message ID and comment text are required' });
    }

    // Validate message exists
    const message = await Message.findById(message_id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Extract user_id from token if present
    let user_id = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user_id = decoded.userId;
      } catch (err) {
        // Continue as anonymous if token invalid
      }
    }

    // Create comment
    const comment = new Comment({
      message_id,
      commenter_name: commenter_name || 'Anonymous',
      user_id,
      comment_text
    });

    await comment.save();

    res.status(201).json({
      message: 'Comment added successfully',
      data: comment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- READ: Get all comments for a message ---
// @route   GET /api/comments/:message_id
// @desc    Get all comments for a specific birthday message
// @access  Public
router.get('/:message_id', async (req, res) => {
  try {
    const { message_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(message_id)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    const comments = await Comment.find({ message_id })
      .populate('user_id', 'username')
      .sort({ created_at: -1 });

    res.json({
      message_id,
      count: comments.length,
      comments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- UPDATE: Edit a comment (only by author) ---
// @route   PUT /api/comments/:id
// @desc    Update a comment
// @access  Private (comment author only) or Public if anonymous
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { comment_text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    if (!comment_text) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    // Find comment
    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check authorization: allow if user is logged in and owns comment, or if it's anonymous
    let isAuthorized = false;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (comment.user_id && comment.user_id.toString() === decoded.userId) {
          isAuthorized = true;
        }
      } catch (err) {
        // Token invalid
      }
    }

    // Allow anonymous comments to be edited without auth
    if (!comment.user_id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to edit this comment' });
    }

    comment.comment_text = comment_text;
    await comment.save();

    res.json({
      message: 'Comment updated successfully',
      data: comment
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- DELETE: Delete a comment (only by author) ---
// @route   DELETE /api/comments/:id
// @desc    Delete a comment
// @access  Private (comment author only) or Public if anonymous
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check authorization
    let isAuthorized = false;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (comment.user_id && comment.user_id.toString() === decoded.userId) {
          isAuthorized = true;
        }
      } catch (err) {
        // Token invalid
      }
    }

    // Allow anonymous comments to be deleted without auth
    if (!comment.user_id) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(id);

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
