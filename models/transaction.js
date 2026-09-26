// models/Transaction.js
// Mongoose schema for a single income/expense transaction.

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  // "expense" or "income" — drives which side of the dashboard the record appears on.
  type: {
    type: String,
    enum: ['expense', 'income'],
    required: true
  },
  // The calendar date the transaction happened on (not the same as createdAt).
  date: {
    type: Date,
    required: true
  },
  // Net amount, always stored as a positive number; `type` supplies the direction.
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // Main category label, e.g. "อาหารและเครื่องดื่ม" — shown as the tree view's top branch.
  category: {
    type: String,
    required: true,
    trim: true
  },
  // Optional note — shown as the tree view's leaf/sub-item label when present.
  note: {
    type: String,
    default: ''
  },
  // Public path to the uploaded receipt image, e.g. "/uploads/1234-567.jpg".
  imagePath: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', transactionSchema);