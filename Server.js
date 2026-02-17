const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");

const app = express();
require("dotenv").config()
const PORT = process.env.DB_PORT 

app.use(express.json())

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
      // school deployment: allow all
      return cb(null, true);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

const dbConfig = mysql.createPool({
        DB_HOST :process.env.DB_HOST,
    DB_PASSWORD:process.env.DB_PASSWORD,
    DB_NAME:process.env.DB_NAME,
    DB_PORT:process.env.DB_PORT,
    DB_USER:process.env.DB_USER
})
// const pool = mysql.createPool(dbConfig);// poool is to settimeot reent timout 

// pool is prevent timeout 
app.get("/", async(req , res)=>{
    const connections = await mysql.createConnection(dbConfig);
    const [rows] = await connections.execute("SELECT * FROM books")
})
app.post("/books", async(req , res)=>{
    const {title , author , genre , price , stock} = req.body;
    const connections = await mysql.createConnection(dbConfig);
    const [rows] = await connections.execute("INSERT INTO books (title ,author , genre , price ,stock) VALUES(? , ? ,?, ? , ?)", [title , author , genre , price , stock]);
    if(rows.affectedRows===0) return res.json({message : "insertion operation failed"});
    return res.json(rows);// return the json 
})
app.delete("/books/:id", async(req , res)=>{
    const {id} = req.params;
    const connections = await mysql.createConnection(dbConfig);
    const [rows] = await connections.execute("DELETE FROM books WHERE id=?", [id]);
    if(rows.affectedRows==0) return res.json({message:"Delete operation failed"});
    return res.json(rows);
})
app.put("/books/:id", async(req , res)=>{
    const {id} =req.params;
    const {title , author , genre , price , stock} = req.body;
    const connections = await mysql.createConnection(dbConfig);
    const [findid] = await connections.execute("SELECT * FROM books WHERE id=?", [id]);
    if(findid.length===0) return res.json({message:"Cannot find the ID "});
    const [rows]=await connections.execute("UPDATE FROM book title=? , author=? , genre=?, price=?, stock=? WHERE id=?",[title , author , genre ,price , stock , id]); 
    return res.json(rows);//beru 
    
})
app.listen(PORT , ()=>{
    console.log('Server running at ' + PORT)
})