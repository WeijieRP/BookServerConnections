const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ================= DATABASE POOL (AIVEN READY) =================
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false, // Required for Aiven
  },
});

// ================= TEST ROUTE =================
app.get("/", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM books");
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ================= CREATE BOOK =================
app.post("/books", async (req, res) => {
  try {
    const { title, author, genre, price, stock } = req.body;

    const [result] = await pool.execute(
      "INSERT INTO books (title, author, genre, price, stock) VALUES (?, ?, ?, ?, ?)",
      [title, author, genre, price, stock]
    );

    res.json({
      message: "Book added successfully",
      bookId: result.insertId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Insert failed" });
  }
});

// ================= DELETE BOOK =================
app.delete("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      "DELETE FROM books WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.json({ message: "Book not found" });
    }

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ================= UPDATE BOOK =================
app.put("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, genre, price, stock } = req.body;

    const [result] = await pool.execute(
      "UPDATE books SET title=?, author=?, genre=?, price=?, stock=? WHERE id=?",
      [title, author, genre, price, stock, id]
    );

    if (result.affectedRows === 0) {
      return res.json({ message: "Book not found" });
    }

    res.json({ message: "Book updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Update failed" });
  }
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
