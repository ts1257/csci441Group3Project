import Persona from "../models/Persona.js";
import User from "../models/User.js";

const ADMIN_PERSONA = {
  name: "Admin",
  description:
    "Admin mode for managing users, system records, and application data",
  color: "#111827",
};

const DEFAULT_PERSONAS = [
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
    description:
      "Travel mode for organizing trips, transit tasks, and travel plans",
    color: "#8b5cf6",
  },
];

async function ensureDefaultPersonas(userId) {
  const user = await User.findById(userId).select("role personas");
  const isAdmin = user?.role === "admin";
  const expectedPersonas = isAdmin
    ? [ADMIN_PERSONA, ...DEFAULT_PERSONAS]
    : DEFAULT_PERSONAS;

  if (!isAdmin) {
    await Persona.deleteMany({ user: userId, name: /^admin$/i });
  }

  const existingPersonas = await Persona.find({ user: userId });
  const existingNames = new Set(
    existingPersonas.map((persona) => persona.name.toLowerCase().trim()),
  );

  const missingPersonas = expectedPersonas
    .filter((persona) => !existingNames.has(persona.name.toLowerCase()))
    .map((persona) => ({
      ...persona,
      user: userId,
    }));

  if (missingPersonas.length > 0) {
    await Persona.insertMany(missingPersonas);
  }

  if (user) {
    user.personas = isAdmin
      ? ["admin", "student", "work", "finance", "wellness", "travel"]
      : ["student", "work", "finance", "wellness", "travel"];
    await user.save();
  }
}

export async function createPersona(req, res, next) {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Persona name is required",
      });
    }

    const persona = await Persona.create({
      user: req.user.userId,
      name: name.trim(),
      description: description?.trim() || "",
      color: color || "#3b82f6",
    });

    res.status(201).json({
      message: "Persona created successfully",
      persona,
    });
  } catch (error) {
    next(error);
  }
}

export async function getPersonas(req, res, next) {
  try {
    await ensureDefaultPersonas(req.user.userId);

    const personas = await Persona.find({ user: req.user.userId }).sort({
      createdAt: 1,
    });

    res.status(200).json({
      personas,
    });
  } catch (error) {
    next(error);
  }
}

export async function updatePersona(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const persona = await Persona.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!persona) {
      return res.status(404).json({
        message: "Persona not found",
      });
    }

    if (name !== undefined) persona.name = name.trim();
    if (description !== undefined) persona.description = description.trim();
    if (color !== undefined) persona.color = color;

    const updatedPersona = await persona.save();

    res.status(200).json({
      message: "Persona updated successfully",
      persona: updatedPersona,
    });
  } catch (error) {
    next(error);
  }
}

export async function deletePersona(req, res, next) {
  try {
    const { id } = req.params;

    const persona = await Persona.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!persona) {
      return res.status(404).json({
        message: "Persona not found",
      });
    }

    await persona.deleteOne();

    res.status(200).json({
      message: "Persona deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
