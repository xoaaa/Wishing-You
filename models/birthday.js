// models/Birthday.js
const mongoose = require('mongoose');

const BirthdaySchema = new mongoose.Schema({
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
  // Tanggal ulang tahun (Date object, for sorting/filtering)
  date: {
    type: Date,
    required: true,
  },
  // MM-DD string for frontend compatibility and sorting
  birthday_date: {
    type: String,
    required: true,
    match: [/^\d{2}-\d{2}$/, 'Birthday must be in MM-DD format']
  },
  // Keterangan atau catatan tambahan (opsional)
  notes: {
    type: String,
    trim: true,
  },
  // Tanggal pembuatan catatan
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Birthday', BirthdaySchema);