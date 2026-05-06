import mongoose from "mongoose";

const habitSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Habit name is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "hydration",
        "sleep",
        "exercise",
        "rest",
        "mental-health",
        "meal",
        "medicine",
        "other",
      ],
      default: "other",
    },
    goal: {
      type: String,
      trim: true,
      default: "",
    },
    progress: {
      type: String,
      trim: true,
      default: "",
    },
    unit: {
      type: String,
      trim: true,
      default: "",
    },
    reminderTime: {
      type: String,
      trim: true,
      default: "",
    },
    completedToday: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Habit = mongoose.model("Habit", habitSchema);

export default Habit;
