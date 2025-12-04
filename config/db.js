const mongoose = require('mongoose');

const connectDB = async () => {
   const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/wishing-you';

  if (!process.env.MONGO_URI) {
    console.warn(' MONGO_URI not set. Falling back to local default:', uri);
    console.warn('For production, set MONGO_URI in your .env file');
  }

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;