const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender_name: {
    type: String,
    default: 'Anonymous',
    trim: true
  },
  message_text: {
    type: String,
    required: [true, 'Message text is required'],
    maxlength: 1000
  },
  target_birthday: {
    type: String, // Format: MM-DD (contoh: "12-25")
    required: [true, 'Target birthday is required'],
    match: [/^\d{2}-\d{2}$/, 'Birthday must be in MM-DD format']
  },
  recipient_username: {
    type: String,
    trim: true,
    default: null
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Null jika anonymous
  },
  reactions: [{
    emoji: String,
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  created_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Message', messageSchema);