import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Course name is required"],
      trim: true,
    },
    instructor: {
      type: String,
      trim: true,
      default: "",
    },
    credits: {
      type: Number,
      default: 0,
    },
    color: {
      type: String,
      default: "#3b82f6",
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

const Course = mongoose.model("Course", courseSchema);

export default Course;
