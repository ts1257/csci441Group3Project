import Project from "../models/Project.js";

export async function getProjects(req, res, next) {
  try {
    const projects = await Project.find({ user: req.user.userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      projects,
    });
  } catch (error) {
    next(error);
  }
}

export async function createProject(req, res, next) {
  try {
    const { name, client, budget, color, description, notes, status } =
      req.body;

    if (!name) {
      return res.status(400).json({
        message: "Project name is required",
      });
    }

    const project = await Project.create({
      user: req.user.userId,
      name: name.trim(),
      client: client?.trim() || "",
      budget: budget !== undefined ? Number(budget) : undefined,
      color: color?.trim() || "",
      description: description?.trim() || "",
      notes: notes?.trim() || "",
      status: status || "active",
    });

    res.status(201).json({
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProject(req, res, next) {
  try {
    const { id } = req.params;
    const { name, client, budget, color, description, notes, status } =
      req.body;

    const project = await Project.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    if (name !== undefined) project.name = name.trim();
    if (client !== undefined) project.client = client.trim();
    if (budget !== undefined) project.budget = Number(budget);
    if (color !== undefined) project.color = color.trim();
    if (description !== undefined) project.description = description.trim();
    if (notes !== undefined) project.notes = notes.trim();
    if (status !== undefined) project.status = status;

    const updatedProject = await project.save();

    res.status(200).json({
      message: "Project updated successfully",
      project: updatedProject,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProject(req, res, next) {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found",
      });
    }

    await project.deleteOne();

    res.status(200).json({
      message: "Project deleted successfully",
    });
  } catch (error) {
    next(error);
  }
}
