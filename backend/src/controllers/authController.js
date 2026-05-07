import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Persona from "../models/Persona.js";
import { generateToken } from "../utils/generateToken.js";

const BASE_DEFAULT_PERSONAS = [
  {
    name: "Student",
    description: "Student mode for managing courses and academic tasks",
    color: "#3b82f6",
  },
  {
    name: "Work",
    description: "Work mode for managing projects and professional tasks",
    color: "#10b981",
  },
  {
    name: "Finance",
    description: "Finance mode for managing budgets, records, and payments",
    color: "#f59e0b",
  },
  {
    name: "Wellness",
    description: "Wellness mode for tracking health, rest, and self-care tasks",
    color: "#ef4444",
  },
  {
    name: "Travel",
    description: "Travel mode for organizing trips, transit tasks, and travel plans",
    color: "#8b5cf6",
  },
];

const ADMIN_PERSONA = {
  name: "Admin",
  description: "Admin mode for managing users, system records, and application data",
  color: "#111827",
};

function getDefaultPersonasForRole(userId, role) {
  const personas = role === "admin" ? [ADMIN_PERSONA, ...BASE_DEFAULT_PERSONAS] : BASE_DEFAULT_PERSONAS;

  return personas.map((persona) => ({
    ...persona,
    user: userId,
  }));
}

function serializeUser(user, personas) {
  return {
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role || "user",
    personas: personas.map((p) => ({
      _id: p._id,
      name: p.name,
      description: p.description,
      color: p.color,
    })),
  };
}

export async function registerUser(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "admin" : "user";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      personas: role === "admin"
        ? ["admin", "student", "work", "finance", "wellness", "travel"]
        : ["student", "work", "finance", "wellness", "travel"],
    });

    const createdPersonas = await Persona.insertMany(getDefaultPersonasForRole(user._id, role));

    res.status(201).json({
      message: "User registered successfully",
      user: serializeUser(user, createdPersonas),
      token: generateToken(user._id.toString(), user.role),
    });
  } catch (error) {
    next(error);
  }
}

export async function loginUser(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const personas = await Persona.find({ user: user._id }).sort({ createdAt: 1 });

    res.status(200).json({
      message: "Login successful",
      user: serializeUser(user, personas),
      token: generateToken(user._id.toString(), user.role),
    });
  } catch (error) {
    next(error);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const personas = await Persona.find({ user: user._id }).sort({ createdAt: 1 });

    res.status(200).json({
      user: {
        ...serializeUser(user, personas),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
