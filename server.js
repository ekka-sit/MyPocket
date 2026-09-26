// server.js
// Entry point for the MyPocket Express server: serves the frontend,
// exposes the transaction/category API, and serves uploaded receipt images.

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const transactionRoutes = require('./routes/transactionRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mypocket';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the static frontend (public/index.html, css/, js/, images/).
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded receipt images so <img src="/uploads/xyz.jpg"> works on the client.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);

// Central error handler (also catches Multer errors, e.g. file too large / wrong type).
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'เกิดข้อผิดพลาดบนเซิร์ฟเวอร์', error: err.message });
});

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('เชื่อมต่อ MongoDB สำเร็จ');
    app.listen(PORT, () => {
      console.log('Server กำลังทำงานที่ http://localhost:' + PORT);
    });
  })
  .catch((err) => {
    console.error('เชื่อมต่อ MongoDB ไม่สำเร็จ:', err.message);
  });