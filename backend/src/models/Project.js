import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    client: {
      type: String,
      trim: true,
      default: "",
    },
    budget: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#10b981",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
  },
  {
    timestamps: true,
  },
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
