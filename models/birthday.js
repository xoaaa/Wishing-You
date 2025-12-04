
const mongoose = require('mongoose');

const BirthdaySchema = new mongoose.Schema({
    
    reminder_enabled: {
      type: Boolean,
      default: true,
    },
  // Menghubungkan ulang tahun dengan pengguna yang menyimpannya
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Nama orang yang ulang tahunnya akan diingat
  name: {
    type: String,
    required: true,
    trim: true,
  },
  date: {
    type: Date,
    required: true,
  },
  birthday_date: {
    type: String,
    required: true,
    match: [/^\d{2}-\d{2}$/, 'Birthday must be in MM-DD format']
  },
  
  notes: {
    type: String,
    trim: true,
  },
  
  description: {
    type: String,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Birthday', BirthdaySchema);