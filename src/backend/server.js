//server.js
require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// MySQL Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "mysql",  // Default AMPPS MySQL password
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

  try {
    // Check if the username already exists
    const checkUserSql = "SELECT * FROM users WHERE username = ?";
    db.query(checkUserSql, [username], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (results.length > 0) {
        return res.status(409).json({ error: "Username already taken" }); // 409 Conflict
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Insert new user
      const sql = "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)";
      db.query(sql, [username, email, hashedPassword], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "User registered successfully" });
      });
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
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
// Get current user info
app.get("/profile", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    // Query the DB for this user's info
    const sql = "SELECT user_id, username, email, profilePic FROM users WHERE user_id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      // Return user data (without the password hash)
      res.json(results[0]);
    });
  } catch (error) {
    console.error("Error in /profile:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});
app.delete("/deleteAccount", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    // Delete user row
    const sql = "DELETE FROM users WHERE user_id = ?";
    db.query(sql, [userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "User not found" });
      }
      return res.json({ message: "Account deleted successfully" });
    });
  } catch (error) {
    console.error("Error in DELETE /deleteAccount:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

app.put("/changePassword", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Missing oldPassword or newPassword" });
    }

    // Fetch user from DB
    const sqlSelect = "SELECT * FROM users WHERE user_id = ?";
    db.query(sqlSelect, [userId], async (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = results[0];
      // Compare oldPassword with hashed password
      const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: "Old password incorrect" });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // Update user's password
      const sqlUpdate = "UPDATE users SET password_hash = ? WHERE user_id = ?";
      db.query(sqlUpdate, [hashedNewPassword, userId], (err, updateResult) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error" });
        }
        return res.json({ message: "Password updated successfully" });
      });
    });
  } catch (error) {
    console.error("Error in /changePassword:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

// Update profile picture
app.post("/updateProfilePicture", upload.single('image'), async (req, res) => {
  try {
    console.log('Received profile picture update request');
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log('No auth header found');
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    if (!req.file) {
      console.log('No file received');
      return res.status(400).json({ error: "No image file provided" });
    }

    console.log('File received:', req.file);
    const imagePath = req.file.path;
    const imageUrl = `http://localhost:3000/uploads/${path.basename(imagePath)}`;

    // Update user's image in database
    const sql = "UPDATE users SET profilePic = ? WHERE user_id = ?";
    db.query(sql, [imageUrl, userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      console.log('Profile picture updated successfully:', imageUrl);
      res.json({ message: "Profile picture updated successfully", image: imageUrl });
    });
  } catch (error) {
    console.error("Error in /updateProfilePicture:", error);
    return res.status(500).json({ message: "Error processing profile picture update" });
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Start Server
app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000 and accessible on local network");
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate recipe based on category
app.post("/generateRecipe", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful cooking assistant. Generate simple, practical recipes with common ingredients."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const recipeText = completion.choices[0].message.content;
    const recipe = JSON.parse(recipeText);
    
    // Use Unsplash API for image search instead of DALL-E
    const unsplashResponse = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(recipe.title)}&per_page=1`,
      {
        headers: {
          'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
        }
      }
    );
    
    const imageData = await unsplashResponse.json();
    if (imageData.results && imageData.results.length > 0) {
      recipe.image = imageData.results[0].urls.regular;
    } else {
      recipe.image = null; // Fallback if no image found
    }
    
    recipe.rating = (Math.random() * 2 + 3).toFixed(1); // Random rating between 3-5

    res.json({ recipe });
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

