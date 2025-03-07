//index.ts
import express from "express";
import cors from "cors";
import router from "./routes"; 

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api", router); // Base API route

const PORT = 5001;
app.listen(PORT, () => console.log(`🔥 Server running on http://localhost:${PORT}`));
