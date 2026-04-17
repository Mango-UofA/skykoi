import { Router } from "express";
import mongoose from "mongoose";

import User from "../models/User.js";
import { hashPassword, signAuthToken, verifyAuthToken, verifyPassword } from "../utils/auth.js";

const router = Router();

function isDbAvailable() {
  return mongoose.connection.readyState === 1;
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    company: user.company || "",
    role: user.role,
    createdAt: user.createdAt
  };
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payload = verifyAuthToken(token, process.env.AUTH_TOKEN_SECRET || "dev-secret-change-me");
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

router.post("/signup", async (req, res) => {
  try {
    if (!isDbAvailable()) {
      return res.status(503).json({ message: "Database unavailable. Configure MongoDB and try again." });
    }

    const { name, email, password, company } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      company: String(company || "").trim(),
      passwordHash: hashPassword(password)
    });

    const token = signAuthToken(
      { sub: user._id.toString(), email: user.email },
      process.env.AUTH_TOKEN_SECRET || "dev-secret-change-me"
    );

    return res.status(201).json({
      message: "Account created",
      token,
      user: sanitizeUser(user)
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create account" });
  }
});

router.post("/login", async (req, res) => {
  try {
    if (!isDbAvailable()) {
      return res.status(503).json({ message: "Database unavailable. Configure MongoDB and try again." });
    }

    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: String(email).trim().toLowerCase() });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signAuthToken(
      { sub: user._id.toString(), email: user.email },
      process.env.AUTH_TOKEN_SECRET || "dev-secret-change-me"
    );

    return res.json({
      message: "Logged in",
      token,
      user: sanitizeUser(user)
    });
  } catch {
    return res.status(500).json({ message: "Failed to log in" });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  return res.json({ user: sanitizeUser(req.user) });
});

export default router;
