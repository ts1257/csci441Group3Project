import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Persona from "../models/Persona.js";
import { generateToken } from "../utils/generateToken.js";

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

    const existingUser = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    // Create default personas for new user
    const defaultPersonas = [
      {
        user: user._id,
        name: "Student",
        description: "Student mode for managing courses and academic tasks",
        color: "#3b82f6",
      },
      {
        user: user._id,
        name: "Work",
        description: "Work mode for managing projects and professional tasks",
        color: "#10b981",
      },
      {
        user: user._id,
        name: "Finance",
        description: "Finance mode for managing budgets, records, and payments",
        color: "#f59e0b",
      },
      {
        user: user._id,
        name: "Wellness",
        description:
          "Wellness mode for tracking health, rest, and self-care tasks",
        color: "#ef4444",
      },
      {
        user: user._id,
        name: "Travel",
        description:
          "Travel mode for organizing trips, transit tasks, and travel plans",
        color: "#8b5cf6",
      },
    ];

    const createdPersonas = await Persona.insertMany(defaultPersonas);

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        personas: createdPersonas.map((p) => ({
          _id: p._id,
          name: p.name,
          description: p.description,
          color: p.color,
        })),
      },
      token: generateToken(user._id.toString()),
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

    // Fetch personas for this user
    const personas = await Persona.find({ user: user._id });

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        personas: personas.map((p) => ({
          _id: p._id,
          name: p.name,
          description: p.description,
          color: p.color,
        })),
      },
      token: generateToken(user._id.toString()),
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

    // Fetch personas for this user
    const personas = await Persona.find({ user: user._id });

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        personas: personas.map((p) => ({
          _id: p._id,
          name: p.name,
          description: p.description,
          color: p.color,
        })),
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}
