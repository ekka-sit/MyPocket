// routes/transactionRoutes.js
// API endpoints for reading and creating income/expense transactions.

const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const upload = require('../middleware/upload');

// GET /api/transactions
// Returns every transaction, newest first. The frontend groups these by
// date and category itself to build the tree-view dashboard.
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลรายการได้', error: err.message });
  }
});

// POST /api/transactions
// Accepts multipart/form-data (an optional "image" file field) plus the
// text fields: type, date, amount, category, note.
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { type, date, amount, category, note } = req.body;

    if (!type || !date || !amount || !category) {
      return res.status(400).json({
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ประเภท, วันที่, จำนวนเงิน, หมวดหมู่)'
      });
    }

    // The frontend numpad already evaluates the expression into a plain
    // number before submitting, so here we just parse and sanity-check it.
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ message: 'จำนวนเงินไม่ถูกต้อง' });
    }

    const transaction = new Transaction({
      type: type,
      date: new Date(date),
      amount: parsedAmount,
      category: category,
      note: note || '',
      imagePath: req.file ? '/uploads/' + req.file.filename : null
    });

    const saved = await transaction.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถบันทึกรายการได้', error: err.message });
  }
});

module.exports = router;