const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// -------------------- CORS --------------------
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  process.env.REACT_APP_API_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(null, true);
    },
  })
);

// ================= DATABASE POOL =================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT), // 🔥 force number
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false, // required for Aiven
  },
});

// ================= GET ALL BOOKS =================
app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM books");
    res.json(rows);
  } catch (error) {
    console.error("GET ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= CREATE BOOK =================
app.post("/books", async (req, res) => {
  try {
    let { title, author, genre, price, stock } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Title and author required" });
    }

    genre = genre || null;
    price = price ? Number(price) : 0;
    stock = stock ? Number(stock) : 0;

    const [result] = await pool.execute(
      "INSERT INTO books (title, author, genre, price, stock) VALUES (?, ?, ?, ?, ?)",
      [title, author, genre, price, stock]
    );

    res.json({
      message: "Book added successfully",
      id: result.insertId,
    });
  } catch (error) {
    console.error("POST ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= DELETE BOOK =================
app.delete("/books/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const [result] = await pool.execute(
      "DELETE FROM books WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= UPDATE BOOK =================
app.put("/books/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    let { title, author, genre, price, stock } = req.body;

    if (!title || !author) {
      return res.status(400).json({ error: "Title and author required" });
    }

    genre = genre || null;
    price = price ? Number(price) : 0;
    stock = stock ? Number(stock) : 0;

    const [result] = await pool.execute(
      "UPDATE books SET title=?, author=?, genre=?, price=?, stock=? WHERE id=?",
      [title, author, genre, price, stock, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.json({ message: "Book updated successfully" });
  } catch (error) {
    console.error("UPDATE ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
