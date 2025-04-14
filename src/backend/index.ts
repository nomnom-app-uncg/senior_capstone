// src/backend/index.ts
import { Router } from "express";
import multer from "multer";
import path from "path";
import { db } from "./db";

const upload = multer({ dest: path.join(__dirname, "uploads") });
export const postRouter = Router();

// Upload a new post
postRouter.post("/posts", upload.single("image"), async (req, res) => {
  const { caption } = req.body;
  const imagePath = `/uploads/${req.file.filename}`;
  const created_at = new Date();

  try {
    await db.query(
      "INSERT INTO posts (image, caption, created_at) VALUES (?, ?, ?)",
      [imagePath, caption, created_at]
    );
    res.status(200).json({ message: "Post created!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch all posts
postRouter.get("/posts", async (_req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM posts ORDER BY created_at DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
