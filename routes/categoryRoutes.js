// routes/categoryRoutes.js
// API endpoints for reading and creating user-defined categories.

const express = require('express');
const router = express.Router();
const Category = require('../models/category');

// GET /api/categories?type=expense|income
// Returns the categories for the given type, sorted alphabetically.
// If no ?type is supplied, all categories are returned.
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) {
      filter.type = req.query.type;
    }
    const categories = await Category.find(filter).sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถดึงหมวดหมู่ได้', error: err.message });
  }
});

// POST /api/categories
// Creates a new category (used by the form's "+ เพิ่มหมวดหมู่ใหม่..." option).
router.post('/', async (req, res) => {
  try {
    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อและประเภทของหมวดหมู่' });
    }

    const category = new Category({ name: String(name).trim(), type: type });
    const saved = await category.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถบันทึกหมวดหมู่ได้', error: err.message });
  }
});

module.exports = router;