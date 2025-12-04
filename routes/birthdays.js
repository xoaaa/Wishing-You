
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); 
const Birthday = require('../models/birthday'); 

router.post('/', auth, async (req, res) => {
  try {

    const { name, date, notes, birthday_date, description } = req.body;
    
    let rawDate = date || birthday_date;
    if (!name || !rawDate) {
      return res.status(400).json({ error: 'Please provide name and date' });
    }

    let mmdd = null;
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
    if (!mmdd) {
      return res.status(400).json({ error: 'Date must be in MM-DD format (e.g., 05-23)' });
    }

    const year = new Date().getFullYear();
    const dateObj = new Date(`${year}-${mmdd}`);

    const desc = typeof description === 'string' ? description : (typeof notes === 'string' ? notes : undefined);

    const birthday = new Birthday({
      userId: req.user._id,
      name,
      date: dateObj,
      notes: desc,
      description: desc,
      birthday_date: mmdd 
    });

    await birthday.save();
    res.status(201).json({ message: 'Birthday added successfully', birthday });

  } catch (error) {
    res.status(500).json({ error: 'Server error while adding birthday: ' + error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const birthdays = await Birthday.find({ userId: req.user._id }).sort('date');
    res.json({ birthdays });
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching birthdays: ' + error.message });
  }
});

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

    let dateObj = null;
    if (mmdd) {
      const year = new Date().getFullYear();
      dateObj = new Date(`${year}-${mmdd}`);
    }

    const updateObj = {};
    if (name) updateObj.name = name;
    
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

router.delete('/:id', auth, async (req, res) => {
  try {
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