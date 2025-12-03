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
// --- READ: Get comments received on messages authored by the logged-in user ---
// @route   GET /api/comments/user/received
// @desc    Get comments left on messages the current user has sent
// @access  Private
router.get('/user/received', auth, async (req, res) => {
  try {
    // Find messages authored by the current user
    const Message = require('../models/message');
    const messages = await Message.find({ user_id: req.user._id }).select('_id message_text target_birthday created_at');

    const messageIds = messages.map(m => m._id);

    if (messageIds.length === 0) {
      return res.json({ count: 0, received: [] });
    }

    // Fetch comments for those messages, but exclude comments authored by the current user
    // (we want 'comments received' from other people; include anonymous comments)
    const comments = await Comment.find({
      message_id: { $in: messageIds },
      $or: [
        { user_id: { $ne: req.user._id } },
        { user_id: null }
      ]
    })
      .populate('user_id', 'username')
      .sort({ created_at: -1 });

    // Group comments by message_id
    const grouped = {};
    comments.forEach(c => {
      const mid = c.message_id.toString();
      if (!grouped[mid]) grouped[mid] = [];
      grouped[mid].push(c);
    });

    // Build response: list of messages with their comments, but only include messages that have comments
    const received = messages.map(m => ({
      message_id: m._id,
      message_text: m.message_text,
      target_birthday: m.target_birthday,
      created_at: m.created_at,
      comments: grouped[m._id.toString()] || []
    })).filter(item => Array.isArray(item.comments) && item.comments.length > 0);

    const totalCount = received.reduce((s, r) => s + (r.comments ? r.comments.length : 0), 0);

    res.json({ count: totalCount, received });
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

// --- READ: Get comments received on messages authored by the logged-in user ---
// @route   GET /api/comments/user/received
// @desc    Get comments left on messages the current user has sent
// @access  Private
router.get('/user/received', auth, async (req, res) => {
  try {
    // Find messages authored by the current user
    const Message = require('../models/message');
    const messages = await Message.find({ user_id: req.user._id }).select('_id message_text target_birthday created_at');

    const messageIds = messages.map(m => m._id);

    if (messageIds.length === 0) {
      return res.json({ count: 0, received: [] });
    }

    // Fetch comments for those messages, but exclude comments authored by the current user
    // (we want 'comments received' from other people; include anonymous comments)
    const comments = await Comment.find({
      message_id: { $in: messageIds },
      $or: [
        { user_id: { $ne: req.user._id } },
        { user_id: null }
      ]
    })
      .sort({ created_at: -1 });

    // Group comments by message_id
    const grouped = {};
    comments.forEach(c => {
      const mid = c.message_id.toString();
      if (!grouped[mid]) grouped[mid] = [];
      grouped[mid].push(c);
    });

    // Build response: list of messages with their comments, but only include messages that have comments
    const received = messages.map(m => ({
      message_id: m._id,
      message_text: m.message_text,
      target_birthday: m.target_birthday,
      created_at: m.created_at,
      comments: grouped[m._id.toString()] || []
    })).filter(item => Array.isArray(item.comments) && item.comments.length > 0);

    const totalCount = received.reduce((s, r) => s + (r.comments ? r.comments.length : 0), 0);

    res.json({ count: totalCount, received });
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
