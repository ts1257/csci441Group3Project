import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    persona: {
      type: String,
      enum: ["student", "work", "finance", "wellness", "travel"],
      required: [true, "Task persona is required"],
      default: "student",
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "completed"],
      default: "todo",
    },
    courseId: {
      type: String,
      trim: true,
      default: "",
    },
    projectId: {
      type: String,
      trim: true,
      default: "",
    },
    taskType: {
      type: String,
      enum: ["general", "habit", "medicine", "checklist"],
      default: "general",
    },
    reminderTime: {
      type: String,
      trim: true,
      default: "",
    },
    tripId: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

const Task = mongoose.model("Task", taskSchema);

export default Task;