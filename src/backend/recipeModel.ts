//handles recipe data

import { db } from "./db";
import { RowDataPacket } from "mysql2/promise";

//  Get all recipes 
export const getAllRecipes = async () => {
  const [rows]: [RowDataPacket[], any] = await db.query("SELECT * FROM recipes");
  return rows; // Returns an array of recipes
};

//  Get a recipe by ID 
export const getRecipeById = async (recipeId: number) => {
  const [rows]: [RowDataPacket[], any] = await db.query(
    "SELECT * FROM recipes WHERE recipe_id = ?", [recipeId]
  );
  return rows.length > 0 ? rows[0] : null;
};