
//usermodel.ts
//user related queries
import { db } from "./db";
import { RowDataPacket } from "mysql2/promise";

//  Get user by ID 
export const getUserById = async (userId: number) => {
  const [rows]: [RowDataPacket[], any] = await db.query(
    "SELECT * FROM users WHERE user_id = ?", [userId]
  );
  return rows.length > 0 ? rows[0] : null;
};

//  Create a new user
export const createUser = async (username: string, email: string) => {
  const [result] = await db.query(
    "INSERT INTO users (username, email) VALUES (?, ?)",
    [username, email]
  );
  return result;
};
