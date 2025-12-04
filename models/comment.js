const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  commenter_name: {
    type: String,
    default: 'Anonymous',
    trim: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  comment_text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: 500,
    trim: true
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', commentSchema);
