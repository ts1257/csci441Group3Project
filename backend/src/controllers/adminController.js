import User from "../models/User.js";
import Task from "../models/Task.js";
import Habit from "../models/Habit.js";
import Trip from "../models/Trip.js";
import Record from "../models/Record.js";
import PlannedPayment from "../models/PlannedPayment.js";
import Course from "../models/Course.js";
import Project from "../models/Project.js";
import Category from "../models/Category.js";
import Persona from "../models/Persona.js";

export async function getAdminStats(req, res, next) {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalTasks,
      totalHabits,
      totalTrips,
      totalRecords,
      totalPlannedPayments,
      totalCourses,
      totalProjects,
      totalCategories,
      totalPersonas,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      Task.countDocuments(),
      Habit.countDocuments(),
      Trip.countDocuments(),
      Record.countDocuments(),
      PlannedPayment.countDocuments(),
      Course.countDocuments(),
      Project.countDocuments(),
      Category.countDocuments(),
      Persona.countDocuments(),
    ]);

    res.status(200).json({
      stats: {
        totalUsers,
        totalAdmins,
        totalTasks,
        totalHabits,
        totalTrips,
        totalRecords,
        totalPlannedPayments,
        totalCourses,
        totalProjects,
        totalCategories,
        totalPersonas,
        totalSystemItems:
          totalTasks +
          totalHabits +
          totalTrips +
          totalRecords +
          totalPlannedPayments +
          totalCourses +
          totalProjects +
          totalCategories +
          totalPersonas,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminUsers(req, res, next) {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });

    res.status(200).json({ users });
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be user or admin" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user.userId && role !== "admin") {
      return res
        .status(400)
        .json({ message: "You cannot remove your own admin role" });
    }

    if (user.role === "admin" && role === "user") {
      const adminCount = await User.countDocuments({ role: "admin" });

      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "At least one admin account is required" });
      }
    }

    user.role = role;
    user.personas =
      role === "admin"
        ? ["admin", "student", "work", "finance", "wellness", "travel"]
        : ["student", "work", "finance", "wellness", "travel"];

    const updatedUser = await user.save();

    if (role === "admin") {
      const adminPersonaExists = await Persona.exists({
        user: user._id,
        name: /^admin$/i,
      });

      if (!adminPersonaExists) {
        await Persona.create({
          user: user._id,
          name: "Admin",
          description:
            "Admin mode for managing users, system records, and application data",
          color: "#111827",
        });
      }
    } else {
      await Persona.deleteMany({ user: user._id, name: /^admin$/i });
    }

    res.status(200).json({
      message: "User role updated successfully",
      user: {
        _id: updatedUser._id,
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;

    if (id === req.user.userId) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });

      if (adminCount <= 1) {
        return res
          .status(400)
          .json({ message: "At least one admin account is required" });
      }
    }

    await Promise.all([
      Task.deleteMany({ user: id }),
      Habit.deleteMany({ user: id }),
      Trip.deleteMany({ user: id }),
      Record.deleteMany({ user: id }),
      PlannedPayment.deleteMany({ user: id }),
      Course.deleteMany({ user: id }),
      Project.deleteMany({ user: id }),
      Category.deleteMany({ user: id }),
      Persona.deleteMany({ user: id }),
    ]);

    await user.deleteOne();

    res
      .status(200)
      .json({ message: "User and related data deleted successfully" });
  } catch (error) {
    next(error);
  }
}

export async function getAdminTasks(req, res, next) {
  try {
    const tasks = await Task.find()
      .populate("user", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ tasks });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminTask(req, res, next) {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    await task.deleteOne();

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
}

const ADMIN_RESOURCE_MODELS = {
  tasks: Task,
  habits: Habit,
  trips: Trip,
  records: Record,
  plannedPayments: PlannedPayment,
  courses: Course,
  projects: Project,
  categories: Category,
};

export async function getAdminData(req, res, next) {
  try {
    const [
      tasks,
      habits,
      trips,
      records,
      plannedPayments,
      courses,
      projects,
      categories,
      personas,
    ] = await Promise.all([
      Task.find().populate("user", "name email role").sort({ createdAt: -1 }),
      Habit.find().populate("user", "name email role").sort({ createdAt: -1 }),
      Trip.find().populate("user", "name email role").sort({ createdAt: -1 }),
      Record.find().populate("user", "name email role").sort({ createdAt: -1 }),
      PlannedPayment.find()
        .populate("user", "name email role")
        .sort({ createdAt: -1 }),
      Course.find().populate("user", "name email role").sort({ createdAt: -1 }),
      Project.find()
        .populate("user", "name email role")
        .sort({ createdAt: -1 }),
      Category.find()
        .populate("user", "name email role")
        .sort({ createdAt: -1 }),
      Persona.find()
        .populate("user", "name email role")
        .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
      data: {
        tasks,
        habits,
        trips,
        records,
        plannedPayments,
        courses,
        projects,
        categories,
        personas,
      },
    });
  } catch (error) {
    next(error);
  }
}

const ADMIN_EDITABLE_FIELDS = {
  tasks: [
    "title",
    "description",
    "persona",
    "dueDate",
    "priority",
    "status",
    "courseId",
    "projectId",
    "taskType",
    "reminderTime",
    "tripId",
  ],
  habits: [
    "name",
    "category",
    "goal",
    "progress",
    "unit",
    "reminderTime",
    "completedToday",
  ],
  trips: [
    "tripName",
    "destination",
    "startDate",
    "endDate",
    "travelType",
    "notes",
  ],
  records: [
    "title",
    "type",
    "amount",
    "category",
    "subcategory",
    "date",
    "notes",
  ],
  plannedPayments: ["title", "amount", "dueDate", "status", "notes"],
  courses: ["name", "instructor", "credits", "color", "notes", "status"],
  projects: [
    "name",
    "client",
    "budget",
    "color",
    "description",
    "notes",
    "status",
  ],
  categories: ["name", "subcategories"],
};

function normalizeAdminUpdate(resource, body) {
  const allowedFields = ADMIN_EDITABLE_FIELDS[resource] || [];
  const update = {};

  allowedFields.forEach((field) => {
    if (body[field] !== undefined) {
      update[field] = body[field];
    }
  });

  if (update.amount !== undefined) update.amount = Number(update.amount) || 0;
  if (update.budget !== undefined) update.budget = Number(update.budget) || 0;
  if (update.credits !== undefined)
    update.credits = Number(update.credits) || 0;

  if (update.dueDate === "") update.dueDate = null;
  if (update.startDate === "") update.startDate = null;
  if (update.endDate === "") update.endDate = null;
  if (update.date === "") update.date = null;

  if (
    update.subcategories !== undefined &&
    !Array.isArray(update.subcategories)
  ) {
    update.subcategories = String(update.subcategories)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (update.checklist !== undefined && !Array.isArray(update.checklist)) {
    update.checklist = String(update.checklist)
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((text) => ({ text, completed: false }));
  }

  if (Array.isArray(update.checklist)) {
    update.checklist = update.checklist
      .map((item) => ({
        text: String(item.text || "").trim(),
        completed: Boolean(item.completed),
      }))
      .filter((item) => item.text);
  }

  return update;
}

export async function updateAdminDataItem(req, res, next) {
  try {
    const { resource, id } = req.params;
    const Model = ADMIN_RESOURCE_MODELS[resource];

    if (!Model || !ADMIN_EDITABLE_FIELDS[resource]) {
      return res.status(400).json({ message: "Invalid admin resource" });
    }

    const update = normalizeAdminUpdate(resource, req.body);

    const item = await Model.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).populate("user", "name email role");

    if (!item) {
      return res.status(404).json({ message: "Record not found" });
    }

    res.status(200).json({
      message: "Record updated successfully",
      item,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteAdminDataItem(req, res, next) {
  try {
    const { resource, id } = req.params;
    const Model = ADMIN_RESOURCE_MODELS[resource];

    if (!Model) {
      return res.status(400).json({ message: "Invalid admin resource" });
    }

    const item = await Model.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Record not found" });
    }

    await item.deleteOne();

    res.status(200).json({ message: "Record deleted successfully" });
  } catch (error) {
    next(error);
  }
}
