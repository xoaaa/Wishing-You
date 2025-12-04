const express = require('express');
const router = express.Router();
const Message = require('../models/message');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

router.post('/', async (req, res) => {
  try {
    const { sender_name, message_text, target_birthday, recipient_username } = req.body;

    if (!message_text || !target_birthday) {
      return res.status(400).json({ error: 'Message and target birthday are required' });
    }

    const dateRegex = /^\d{2}-\d{2}$/;
    if (!dateRegex.test(target_birthday)) {
      return res.status(400).json({ error: 'Birthday must be in MM-DD format (e.g., 05-23)' });
    }

    let user_id = null;
    const authHeader = req.header('Authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user_id = decoded.userId;
        console.log('✅ Message POST: User authenticated, userId:', user_id);
      } catch (err) {
        console.error('Token verification failed during message post:', err.message);
       
      }
    } else {
      console.log('✅ Message POST: Anonymous message');
    }

    const message = new Message({
      sender_name: sender_name || 'Anonymous',
      message_text,
      target_birthday,
      user_id: user_id,
      recipient_username: recipient_username || null
    });

    await message.save();

    res.status(201).json({
      message: 'Birthday message sent successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/sent', auth, async (req, res) => {
  try {
    const messages = await Message.find({ user_id: req.user._id })
      .sort({ created_at: -1 });

    const User = require('../models/user');
    const enhanced = [];

    for (const msg of messages) {
      const obj = msg.toObject ? msg.toObject() : msg;
      try {
        const recipient = await User.findOne({ birthday_date: obj.target_birthday }).select('username');
        if (recipient) {
          obj.recipient_username = recipient.username;
        }
      } catch (err) {
      }
      enhanced.push(obj);
    }

    res.json({
      count: enhanced.length,
      messages: enhanced
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/user/received', auth, async (req, res) => {
  try {
    const userBirthday = req.user.birthday_date;

    const messages = await Message.find({ target_birthday: userBirthday })
      .populate('user_id', 'username')
      .sort({ created_at: -1 });

    res.json({
      birthday: userBirthday,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/today/all', async (req, res) => {
  try {
    
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${month}-${day}`;

    const messages = await Message.find({ target_birthday: todayFormatted })
      .populate('user_id', 'username')
      .sort({ created_at: -1 });

    res.json({
      date: todayFormatted,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/longest/all', async (req, res) => {
  try {
    const messages = await Message.find()
      .populate('user_id', 'username')
      .sort({ message_text: -1 }); 

    let longestMessage = null;
    let maxLength = 0;

    messages.forEach(msg => {
      if (msg.message_text.length > maxLength) {
        maxLength = msg.message_text.length;
        longestMessage = msg;
      }
    });

    if (!longestMessage) {
      return res.status(404).json({ message: 'No messages found' });
    }

    res.json({
      message: 'Longest birthday message',
      length: maxLength,
      data: longestMessage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query; 

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const messages = await Message.find({
      message_text: { $regex: q, $options: 'i' } 
    })
      .populate('user_id', 'username')
      .sort({ created_at: -1 });

    res.json({
      query: q,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;

    const dateRegex = /^\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: 'Date must be in MM-DD format (e.g., 05-23)' });
    }

    const messages = await Message.find({ target_birthday: date })
      .populate('user_id', 'username') 
      .sort({ created_at: -1 }); 

    res.json({
      date,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid message id' });
    }
    const { message_text, target_birthday } = req.body;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.user_id || message.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only edit your own messages' });
    }

    if (message_text) message.message_text = message_text;
    if (target_birthday) {
      const dateRegex = /^\d{2}-\d{2}$/;
      if (!dateRegex.test(target_birthday)) {
        return res.status(400).json({ error: 'Birthday must be in MM-DD format' });
      }
      message.target_birthday = target_birthday;
    }

    await message.save();

    res.json({
      message: 'Message updated successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid message id' });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (!message.user_id || message.user_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You can only delete your own messages' });
    }

    await Message.findByIdAndDelete(id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/reactions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid message id' });
    }
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const existingReaction = message.reactions.find(
      r => r.user_id && r.user_id.toString() === req.user._id.toString()
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      message.reactions.push({
        emoji,
        user_id: req.user._id
      });
    }

    await message.save();

    res.json({
      message: 'Reaction added successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/reactions', auth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid message id' });
    }

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.reactions = message.reactions.filter(
      r => !r.user_id || r.user_id.toString() !== req.user._id.toString()
    );

    await message.save();

    res.json({
      message: 'Reaction removed successfully',
      data: message
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/search/query', async (req, res) => {
  try {
    const { q } = req.query; // Query parameter: ?q=happy

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const messages = await Message.find({
      message_text: { $regex: q, $options: 'i' } 
    })
      .populate('user_id', 'username')
      .sort({ created_at: -1 });

    res.json({
      query: q,
      count: messages.length,
      messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;