// models/InstagramRecord.js
// Mongoose schema for Instagram usernames

const mongoose = require('mongoose');

const InstagramRecordSchema = new mongoose.Schema({
  username: { type: String, required: true },
  scraped_at: { type: Date, default: Date.now },
  // Status can be "unused", "used", "processed", "invalid", etc.
  status: { type: String, default: 'unused' },
  notes: { type: String, default: '' },
});

// Mongoose will automatically create an _id field
module.exports = mongoose.model('InstagramRecord', InstagramRecordSchema);
