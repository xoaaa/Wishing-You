const express = require('express');
const router = express.Router();
const Comment = require('../models/comment');
const Message = require('../models/message');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

router.post('/', async (req, res) => {
  try {
    const { message_id, commenter_name, comment_text } = req.body;

    if (!message_id || !comment_text) {
      return res.status(400).json({ error: 'Message ID and comment text are required' });
    }

    const message = await Message.findById(message_id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    let user_id = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user_id = decoded.userId;
      } catch (err) {
      }
    }

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

router.get('/user/received', auth, async (req, res) => {
  try {
    const Message = require('../models/message');
    const messages = await Message.find({ user_id: req.user._id }).select('_id message_text target_birthday created_at');

    const messageIds = messages.map(m => m._id);

    if (messageIds.length === 0) {
      return res.json({ count: 0, received: [] });
    }

    const comments = await Comment.find({
      message_id: { $in: messageIds },
      $or: [
        { user_id: { $ne: req.user._id } },
        { user_id: null }
      ]
    })
      .sort({ created_at: -1 });

    const grouped = {};
    comments.forEach(c => {
      const mid = c.message_id.toString();
      if (!grouped[mid]) grouped[mid] = [];
      grouped[mid].push(c);
    });

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

router.get('/:message_id', async (req, res) => {
  try {
    const { message_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(message_id)) {
      return res.status(400).json({ error: 'Invalid message ID' });
    }

    let currentUserId = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentUserId = decoded.userId;
      } catch (err) {
      }
    }

    const comments = await Comment.find({ message_id })
      .populate('user_id', 'username')
      .sort({ created_at: -1 });

    const commentsWithAuthority = comments.map(comment => {
      const commentObj = comment.toObject();
      commentObj.isAuthor = currentUserId && comment.user_id && comment.user_id._id.toString() === currentUserId;
      return commentObj;
    });

    res.json({
      message_id,
      count: commentsWithAuthority.length,
      comments: commentsWithAuthority
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

    const comment = await Comment.findById(id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

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
       
      }
    }

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
      }
    }

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
