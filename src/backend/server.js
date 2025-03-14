//server.js
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nomnomapp",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to MySQL database.");
  }
});

// JWT Secret Key
const SECRET_KEY = "your_secret_key";

// Register User
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Insert user into database
  const sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
  db.query(sql, [username, email, hashedPassword], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "User registered successfully" });
  });
});

// Login User
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: err });

    if (results.length === 0) return res.status(401).json({ message: "User not found" });

    const user = results[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    // Generate JWT token
    const token = jwt.sign({ user_id: user.user_id }, SECRET_KEY, { expiresIn: "1h" });

    res.json({ token, username: user.username, email: user.email });
  });
});

// Start Server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});

// Save a new recipe for the logged-in user
app.post("/saveRecipe", (req, res) => {
  try {
    // 1) Check for the Authorization header
    const authHeader = req.headers.authorization; 
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }
    // 2) Extract the token (assuming 'Bearer <token>')
    const token = authHeader.split(" ")[1];

    // 3) Verify the token
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id; // we stored user_id in the token

    // 4) Get recipe data from the request body
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Missing recipe title or content" });
    }

    // 5) Insert into saved_recipes
    const sql = "INSERT INTO saved_recipes (user_id, title, content) VALUES (?, ?, ?)";
    db.query(sql, [userId, title, content], (err, result) => {
      if (err) {
        console.error("Error saving recipe:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.json({ message: "Recipe saved successfully" });
    });
  } catch (error) {
    console.error("Error in /saveRecipe:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});
// Get all saved recipes for the logged-in user
app.get("/savedRecipes", (req, res) => {
  try {
    const authHeader = req.headers.authorization; 
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    const sql = "SELECT * FROM saved_recipes WHERE user_id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Error fetching recipes:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.json(results);
    });
  } catch (error) {
    console.error("Error in /savedRecipes:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});
// Delete a saved recipe
app.delete("/savedRecipes/:recipeId", (req, res) => {
  try {
    // 1) Check for the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    // 2) Extract the token
    const token = authHeader.split(" ")[1];

    // 3) Verify the token
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    // 4) Get the recipe ID from URL params
    const { recipeId } = req.params;

    // 5) Delete from saved_recipes where recipe_id AND user_id match
    const sql = "DELETE FROM saved_recipes WHERE recipe_id = ? AND user_id = ?";
    db.query(sql, [recipeId, userId], (err, result) => {
      if (err) {
        console.error("Error deleting recipe:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (result.affectedRows === 0) {
        // Means no row matched (recipe might not exist or doesn't belong to user)
        return res.status(404).json({ message: "Recipe not found or doesn't belong to user" });
      }
      return res.json({ message: "Recipe deleted successfully" });
    });
  } catch (error) {
    console.error("Error in DELETE /savedRecipes/:recipeId:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

