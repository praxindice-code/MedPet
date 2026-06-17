import express from "express";
import { register, login, verifyToken, getUserProfile } from "../services/auth.js";
import { addMedicalHistoryItem, deleteMedicalHistoryItem } from "../services/db.js";

const router = express.Router();

// Middleware to verify JWT token
export function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  const verification = verifyToken(token);
  if (!verification.valid) {
    return res.status(401).json({ error: "Invalid token" });
  }

  req.userId = verification.userId;
  req.email = verification.email;
  next();
}

// POST /auth/register
router.post("/register", async (req, res) => {
  const { email, password, name, age, gender } = req.body;

  if (!email || !password || !name || !age || !gender) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const result = await register(email, password, name, age, gender);

  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ token: result.token, userId: result.userId });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const result = await login(email, password);

  if (!result.success) {
    return res.status(401).json({ error: result.error });
  }

  res.json({ token: result.token, userId: result.userId });
});

// GET /auth/profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const profile = await getUserProfile(req.userId);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/medical-history
router.post("/medical-history", authMiddleware, async (req, res) => {
  const { type, value } = req.body;

  if (!type || !value) {
    return res.status(400).json({ error: "Type and value required" });
  }

  if (!["medications", "allergies", "conditions"].includes(type)) {
    return res.status(400).json({ error: "Invalid type" });
  }

  try {
    const itemId = await addMedicalHistoryItem(req.userId, type, value);
    res.json({ id: itemId, type, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /auth/medical-history/:id
router.delete("/medical-history/:id", authMiddleware, async (req, res) => {
  try {
    await deleteMedicalHistoryItem(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
