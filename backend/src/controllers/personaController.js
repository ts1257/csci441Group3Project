import Persona from "../models/Persona.js";

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
    const personas = await Persona.find({ user: req.user.userId }).sort({
      createdAt: -1,
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