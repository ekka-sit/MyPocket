// routes/transactionRoutes.js
// API endpoints for reading, creating, updating, and deleting income/expense transactions.

const express = require('express');
const router = express.Router();
const Transaction = require('../models/transaction');
const upload = require('../middleware/upload');

// GET /api/transactions
// Returns transactions filtered by year and month if provided, newest first.
router.get('/', async (req, res) => {
  try {
    const { year, month } = req.query;
    let query = {};

    if (year) {
      const y = parseInt(year, 10);
      if (month) {
        const m = parseInt(month, 10) - 1; // JS Date index (0 = Jan, 8 = Sep)
        const startDate = new Date(y, m, 1, 0, 0, 0, 0);
        const endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
        query.date = { $gte: startDate, $lte: endDate };
      } else {
        const startDate = new Date(y, 0, 1, 0, 0, 0, 0);
        const endDate = new Date(y, 11, 31, 23, 59, 59, 999);
        query.date = { $gte: startDate, $lte: endDate };
      }
    }

    const transactions = await Transaction.find(query).sort({ date: -1, createdAt: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลรายการได้', error: err.message });
  }
});

// POST /api/transactions
// Accepts multipart/form-data (an optional "image" file field) plus text fields.
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { type, date, amount, category, note } = req.body;

    if (!type || !date || !amount || !category) {
      return res.status(400).json({
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน (ประเภท, วันที่, จำนวนเงิน, หมวดหมู่)'
      });
    }

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

// PUT /api/transactions/:id
// Updates an existing transaction (supports uploading a new receipt image)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { type, date, amount, category, note } = req.body;
    const updateData = {};

    if (type) updateData.type = type;
    if (date) updateData.date = new Date(date);
    if (amount) {
      const parsedAmount = Number(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        return res.status(400).json({ message: 'จำนวนเงินไม่ถูกต้อง' });
      }
      updateData.amount = parsedAmount;
    }
    if (category) updateData.category = category;
    if (note !== undefined) updateData.note = note;
    if (req.file) {
      updateData.imagePath = '/uploads/' + req.file.filename;
    }

    const updated = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'ไม่พบรายการที่ต้องการแก้ไข' });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถแก้ไขรายการได้', error: err.message });
  }
});

// DELETE /api/transactions/:id
// Deletes a transaction by ID
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Transaction.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'ไม่พบรายการที่ต้องการลบ' });
    }
    res.json({ message: 'ลบรายการสำเร็จ', id: req.params.id });
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถลบรายการได้', error: err.message });
  }
});

module.exports = router;