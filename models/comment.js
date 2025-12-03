const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Reference to the birthday message being commented on
  message_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  // Commenter info
  commenter_name: {
    type: String,
    default: 'Anonymous',
    trim: true
  },
  // User ID of commenter (null if anonymous)
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Comment text
  comment_text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: 500,
    trim: true
  },
  // Timestamp
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Comment', commentSchema);
