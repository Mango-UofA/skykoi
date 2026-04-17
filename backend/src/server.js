import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import { connectDb } from "./config/db.js";
import contentRoutes from "./routes/contentRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173"
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "skykoi-clone-api" });
});

app.use("/api/content", contentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api", leadRoutes);

async function bootstrap() {
  await connectDb(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/skykoi_clone");

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Server failed to start:", error.message);
  process.exit(1);
});
