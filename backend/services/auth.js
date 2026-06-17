import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  getUser,
  createUser,
  createProfile,
  getProfile,
  getMedicalHistory
} from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "medpet-secret-key-change-in-prod";

export async function register(email, password, name, age, gender) {
  try {
    // Check if user already exists
    const existingUser = getUser(email);
    if (existingUser) {
      throw new Error("Email already registered");
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const userId = createUser(email, passwordHash);

    // Create profile
    createProfile(userId, name, age, gender);

    // Generate JWT token
    const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: "7d" });

    return { success: true, token, userId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function login(email, password) {
  try {
    const user = getUser(email);
    if (!user) {
      throw new Error("User not found");
    }

    // Compare password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid password");
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d"
    });

    return { success: true, token, userId: user.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, userId: decoded.userId, email: decoded.email };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

export function getUserProfile(userId) {
  try {
    const profile = getProfile(userId);
    const medicalHistory = getMedicalHistory(userId);
    
    return {
      ...profile,
      ...medicalHistory
    };
  } catch (err) {
    throw new Error("Failed to fetch profile: " + err.message);
  }
}
