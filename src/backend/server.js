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

// Validate required environment variables
const requiredEnvVars = ['UNSPLASH_ACCESS_KEY', 'OPENAI_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: ${envVar} is not set in environment variables`);
    process.exit(1);
  }
}

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
    fileSize: 15 * 1024 * 1024 // 15MB limit
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
  password: "",  // Default AMPPS MySQL password
  database: "nomnomapp",
  port: 3307,
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

    // ✅ Send back token and full user object (including user_id)
        res.json({
          token,
          user: {
            id: user.user_id, // match frontend's expectations
            username: user.username,
            email: user.email,
            profilePic: user.profilePic || null
          }
        });
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

        const sql = `
      SELECT 
        users.user_id, 
        users.username, 
        users.email, 
        users.profilePic,
        (
          SELECT COUNT(*) 
          FROM likes 
          JOIN posts ON likes.post_id = posts.id 
          WHERE posts.user_id = users.user_id
        ) AS totalLikes,
        (
          SELECT COUNT(*)
          FROM comments
          JOIN posts ON comments.post_id = posts.id
          WHERE posts.user_id = users.user_id
        ) AS totalComments
      FROM users 
      WHERE users.user_id = ?
    `;

        db.query(sql, [userId], (err, results) => {
            if (err) {
                console.error("Database error:", err);
                return res.status(500).json({ error: "Database error" });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            res.json(results[0]); // ✅ Return full user profile + totalLikes
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
    const filename = req.file.filename;
    const imageUrl = `/uploads/${filename}`;

    // ✅ FIXED PROMISE USAGE
    await db.promise().query(
      "UPDATE users SET profilePic = ? WHERE user_id = ?",
      [imageUrl, userId]
    );

    const fullImageUrl = `${req.protocol}://${req.get("host")}${imageUrl}`;
    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ image: fullImageUrl });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    return res.status(500).json({ error: "Failed to update profile picture" });
  }
});


// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

// Define your backend server IP or LAN IP
const SERVER_IP = process.env.SERVER_IP || "http://localhost:3000";

app.post("/posts", upload.single("image"), (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    if (!req.file || !req.body.caption) {
      return res.status(400).json({ error: "Missing file or caption" });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const caption = req.body.caption;

    const sql = "INSERT INTO posts (image, caption, created_at, user_id) VALUES (?, ?, NOW(), ?)";
    db.query(sql, [imageUrl, caption, userId], (err, result) => {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const fullImageUrl = `${req.protocol}://${req.headers.host}${imageUrl}`;
      res.json({ id: result.insertId, image: fullImageUrl, caption });
    });
  } catch (err) {
    console.error("Error in POST /posts:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});


app.get("/posts", (req, res) => {
  const sql = `
    SELECT 
    posts.*, 
    users.username, 
    users.profilePic,
    (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likeCount,
    (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS commentCount
  FROM posts
  JOIN users ON posts.user_id = users.user_id
  ORDER BY posts.created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching posts:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const fixed = results.map((post) => ({
      ...post,
      image: post.image.startsWith("http")
        ? post.image
        : `${req.protocol}://${req.headers.host}${post.image}`,
      profilePic: post.profilePic?.startsWith("http")
        ? post.profilePic
        : `${req.protocol}://${req.headers.host}${post.profilePic || ""}`,
    }));

    res.json(fixed);
  });
});

app.post("/like", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;
    const { postId } = req.body;

    if (!postId) return res.status(400).json({ error: "Missing postId" });

    const sql = "INSERT IGNORE INTO likes (post_id, user_id) VALUES (?, ?)";
    db.query(sql, [postId, userId], (err, result) => {
      if (err) {
        console.error("Error liking post:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.json({ message: "Post liked" });
    });
  } catch (error) {
    console.error("Like error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
});

app.delete("/unlike", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;
    const { postId } = req.body;

    if (!postId) return res.status(400).json({ error: "Missing postId" });

    const sql = "DELETE FROM likes WHERE post_id = ? AND user_id = ?";
    db.query(sql, [postId, userId], (err, result) => {
      if (err) {
        console.error("Error unliking post:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.json({ message: "Post unliked" });
    });
  } catch (error) {
    console.error("Unlike error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
});

app.get("/myLikes", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    const sql = "SELECT post_id FROM likes WHERE user_id = ?";
    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Error fetching liked posts:", err);
        return res.status(500).json({ error: "Database error" });
      }
      const likedPostIds = results.map(r => r.post_id);
      res.json(likedPostIds);
    });
  } catch (error) {
    console.error("Error in /myLikes:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
});

app.post("/comment", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;
    const { postId, content } = req.body;

    if (!postId || !content) return res.status(400).json({ error: "Missing postId or content" });

    const sql = "INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)";
    db.query(sql, [postId, userId, content], (err, result) => {
      if (err) {
        console.error("Error adding comment:", err);
        return res.status(500).json({ error: "Database error" });
      }
      return res.json({ message: "Comment added" });
    });
  } catch (error) {
    console.error("Comment error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
});

app.get("/comments/:postId", (req, res) => {
  const { postId } = req.params;

  const sql = `
    SELECT comments.*, users.username, users.profilePic
    FROM comments
    JOIN users ON comments.user_id = users.user_id
    WHERE post_id = ?
    ORDER BY created_at ASC
  `;

  db.query(sql, [postId], (err, results) => {
    if (err) {
      console.error("Error fetching comments:", err);
      return res.status(500).json({ error: "Database error" });
    }

    const formatted = results.map(comment => ({
      ...comment,
      profilePic: comment.profilePic?.startsWith("http")
        ? comment.profilePic
        : `${req.protocol}://${req.headers.host}${comment.profilePic || ""}`,
    }));

    res.json(formatted);
  });
});

app.delete("/posts/:postId", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;
    const postId = req.params.postId;

    // Ensure the post belongs to the logged-in user
    const checkOwnershipQuery = "SELECT * FROM posts WHERE id = ? AND user_id = ?";
    db.query(checkOwnershipQuery, [postId, userId], (err, results) => {
      if (err) {
        console.error("Error checking post ownership:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (results.length === 0) {
        return res.status(403).json({ error: "Not authorized to delete this post" });
      }

      // Delete the post and any associated comments/likes if desired
      const deletePostQuery = "DELETE FROM posts WHERE id = ?";
      db.query(deletePostQuery, [postId], (err) => {
        if (err) {
          console.error("Error deleting post:", err);
          return res.status(500).json({ error: "Database error" });
        }

        return res.json({ message: "Post deleted" });
      });
    });
  } catch (err) {
    console.error("Post delete error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
});

app.get("/myPosts", (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);
    const userId = decoded.user_id;

    const sql = `
      SELECT posts.*, users.username, users.profilePic,
        (SELECT COUNT(*) FROM likes WHERE likes.post_id = posts.id) AS likeCount,
        (SELECT COUNT(*) FROM comments WHERE comments.post_id = posts.id) AS commentCount
      FROM posts
      JOIN users ON posts.user_id = users.user_id
      WHERE posts.user_id = ?
      ORDER BY posts.created_at DESC
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Error fetching my posts:", err);
        return res.status(500).json({ error: "Database error" });
      }

      const formatted = results.map((post) => ({
        ...post,
        image: post.image?.startsWith("http")
          ? post.image
          : `${req.protocol}://${req.headers.host}${post.image}`,
        profilePic: post.profilePic?.startsWith("http")
          ? post.profilePic
          : `${req.protocol}://${req.headers.host}${post.profilePic || ""}`,
      }));

      res.json(formatted);
    });
  } catch (error) {
    console.error("myPosts error:", error);
    return res.status(401).json({ message: "Invalid token" });
  }
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
    try {
      const unsplashResponse = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(recipe.title)}&per_page=1`,
        {
          headers: {
            'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
          }
        }
      );
      
      if (!unsplashResponse.ok) {
        throw new Error(`Unsplash API error: ${unsplashResponse.status}`);
      }
      
      const imageData = await unsplashResponse.json();
      if (imageData.results && imageData.results.length > 0) {
        recipe.image = imageData.results[0].urls.regular;
      } else {
        recipe.image = "https://via.placeholder.com/400x300?text=No+Image+Available";
      }
    } catch (unsplashError) {
      console.error("Error fetching image from Unsplash:", unsplashError);
      recipe.image = "https://via.placeholder.com/400x300?text=No+Image+Available";
    }
    
    recipe.rating = (Math.random() * 2 + 3).toFixed(1); // Random rating between 3-5

    res.json({ recipe });
  } catch (error) {
    console.error("Error generating recipe:", error);
    res.status(500).json({ error: "Failed to generate recipe" });
  }
});

