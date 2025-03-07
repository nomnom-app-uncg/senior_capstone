import express, { Request, Response, Router } from "express";
import { getUserSwipeCount, addSwipe, getLikedDishes } from "./swipeModel";
import { getAllRecipes, getRecipeById } from "./recipeModel";

const router: Router = express.Router();

//  GET - Get today's swipe count
router.get("/user/liked-dishes/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const likedDishes = await getLikedDishes(userId);
    res.json(likedDishes);
  } catch (error) {
    console.error("Error fetching liked dishes:", error);
    res.status(500).json({ error: "Failed to fetch liked dishes" });
  }
});


//  POST - Save a new swipe
router.post("/user/swipe", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, recipeId, liked } = req.body;
    if (!userId || !recipeId || liked === undefined) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }
    await addSwipe(userId, recipeId, liked);
    res.json({ message: "Swipe saved successfully!" });
  } catch (error) {
    console.error("Error saving swipe:", error);
    res.status(500).json({ error: "Failed to save swipe" });
  }
});

// GET - Get all liked dishes for a user
router.get("/user/liked-dishes/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const likedDishes = await getLikedDishes(userId);
    res.json(likedDishes);
  } catch (error) {
    console.error("Error fetching liked dishes:", error);
    res.status(500).json({ error: "Failed to fetch liked dishes" });
  }
});

//  GET - Get all recipes
router.get("/recipes", async (req: Request, res: Response): Promise<void> => {
  try {
    const recipes = await getAllRecipes();
    res.json(recipes);
  } catch (error) {
    console.error("Error fetching recipes:", error);
    res.status(500).json({ error: "Failed to fetch recipes" });
  }
});

export default router;
