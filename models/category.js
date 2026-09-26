// models/Category.js
// Mongoose schema for a user-defined transaction category.

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  // Categories are scoped to a type so the form's dropdown only shows
  // expense categories in expense mode, and income categories in income mode.
  type: {
    type: String,
    enum: ['expense', 'income'],
    required: true
  }
});

module.exports = mongoose.model('Category', categorySchema);