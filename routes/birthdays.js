// routes/birthdays.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Middleware otentikasi Anda
const Birthday = require('../models/birthday'); // Model yang baru dibuat

// --- 1. CREATE: Tambah Ulang Tahun Baru (POST) ---
// @route POST /api/birthdays
// @desc Tambah pengingat ulang tahun baru
// @access Private
router.post('/', auth, async (req, res) => {
  try {

    const { name, date, notes, birthday_date, description } = req.body;
    // Accept both 'date' and 'birthday_date' for compatibility
    let rawDate = date || birthday_date;
    if (!name || !rawDate) {
      return res.status(400).json({ error: 'Please provide name and date' });
    }

    // Normalize to MM-DD format
    let mmdd = null;
    if (typeof rawDate === 'string') {
      // Accept YYYY-MM-DD, MM-DD, MM/DD/YYYY
      if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
        // YYYY-MM-DD
        const [, m, d] = rawDate.split('-');
        mmdd = `${m}-${d}`;
      } else if (/^\d{2}-\d{2}$/.test(rawDate)) {
        mmdd = rawDate;
      } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
        // MM/DD/YYYY
        const [m, d] = rawDate.split('/');
        mmdd = `${m}-${d}`;
      }
    }
    if (!mmdd) {
      return res.status(400).json({ error: 'Date must be in MM-DD format (e.g., 05-23)' });
    }

    // Store as MM-DD string for calendar logic, but also as Date for DB
    // For DB, use current year for Date object
    const year = new Date().getFullYear();
    const dateObj = new Date(`${year}-${mmdd}`);

    // Use description if provided; fall back to notes
    const desc = typeof description === 'string' ? description : (typeof notes === 'string' ? notes : undefined);

    const birthday = new Birthday({
      userId: req.user._id,
      name,
      date: dateObj,
      notes: desc,
      description: desc,
      birthday_date: mmdd // Store MM-DD string for frontend compatibility
    });

    await birthday.save();
    res.status(201).json({ message: 'Birthday added successfully', birthday });

  } catch (error) {
    res.status(500).json({ error: 'Server error while adding birthday: ' + error.message });
  }
});

// --- 2. READ: Ambil Semua Ulang Tahun (GET) ---
// @route GET /api/birthdays
// @desc Ambil semua pengingat ulang tahun pengguna
// @access Private
router.get('/', auth, async (req, res) => {
  try {
    const birthdays = await Birthday.find({ userId: req.user._id }).sort('date');
    res.json({ birthdays });
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching birthdays: ' + error.message });
  }
});

// --- 3. UPDATE: Ubah Ulang Tahun (PUT) ---
// @route PUT /api/birthdays/:id
// @desc Ubah pengingat ulang tahun berdasarkan ID
// @access Private
router.put('/:id', auth, async (req, res) => {
  try {

    const { name, date, notes, birthday_date, reminder_enabled, description } = req.body;
    let rawDate = date || birthday_date;
    let mmdd = null;
    if (rawDate) {
      if (typeof rawDate === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
          const [, m, d] = rawDate.split('-');
          mmdd = `${m}-${d}`;
        } else if (/^\d{2}-\d{2}$/.test(rawDate)) {
          mmdd = rawDate;
        } else if (/^\d{2}\/\d{2}\/\d{4}$/.test(rawDate)) {
          const [m, d] = rawDate.split('/');
          mmdd = `${m}-${d}`;
        }
      }
    }

    // For DB, use current year for Date object
    let dateObj = null;
    if (mmdd) {
      const year = new Date().getFullYear();
      dateObj = new Date(`${year}-${mmdd}`);
    }

    // Build update object
    const updateObj = {};
    if (name) updateObj.name = name;
    // Accept either description or notes from client
    const desc = typeof description === 'string' ? description : (typeof notes === 'string' ? notes : undefined);
    if (typeof desc !== 'undefined') {
      updateObj.notes = desc;
      updateObj.description = desc;
    }
    if (dateObj) updateObj.date = dateObj;
    if (mmdd) updateObj.birthday_date = mmdd;
    if (typeof reminder_enabled !== 'undefined') updateObj.reminder_enabled = reminder_enabled;

    let birthday = await Birthday.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      updateObj,
      { new: true, runValidators: true }
    );

    if (!birthday) {
      return res.status(404).json({ error: 'Birthday not found or not authorized' });
    }

    res.json({ message: 'Birthday updated successfully', birthday });

  } catch (error) {
    res.status(500).json({ error: 'Server error while updating birthday: ' + error.message });
  }
});

// --- 4. DELETE: Hapus Ulang Tahun (DELETE) ---
// @route DELETE /api/birthdays/:id
// @desc Hapus pengingat ulang tahun berdasarkan ID
// @access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    // Pastikan ID ulang tahun yang akan dihapus adalah milik pengguna yang sedang login
    const birthday = await Birthday.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user._id 
    });

    if (!birthday) {
      return res.status(404).json({ error: 'Birthday not found or not authorized' });
    }

    res.json({ message: 'Birthday deleted successfully' });

  } catch (error) {
    res.status(500).json({ error: 'Server error while deleting birthday: ' + error.message });
  }
});

module.exports = router;