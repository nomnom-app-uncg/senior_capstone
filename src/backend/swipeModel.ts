import { db } from "./db";
import { RowDataPacket, ResultSetHeader } from "mysql2/promise";

//  Get today's swipe count for a user
export const getUserSwipeCount = async (userId: number) => {
  const [rows]: [RowDataPacket[], any] = await db.query(
    "SELECT COUNT(*) AS swipe_count FROM user_swipes WHERE user_id = ? AND DATE(swiped_at) = CURDATE()",
    [userId]
  );
  return rows.length > 0 ? rows[0].swipe_count : 0;
};

//  Insert a new swipe (like or dislike)
export const addSwipe = async (userId: number, recipeId: number, liked: boolean) => {
  await db.query<ResultSetHeader>(
    "INSERT INTO user_swipes (user_id, recipe_id, liked) VALUES (?, ?, ?)",
    [userId, recipeId, liked]
  );
};

//  Get all liked dishes for a user
export const getLikedDishes = async (userId: number) => {
  const [rows]: [RowDataPacket[], any] = await db.query(
    `SELECT sr.recipe_id, sr.recipe_name, sr.recipe_details, sr.saved_at 
     FROM saved_recipes sr
     JOIN user_swipes us ON sr.recipe_id = us.recipe_id 
     WHERE us.user_id = ? AND us.liked = true`,
    [userId]
  );
  return rows;
};