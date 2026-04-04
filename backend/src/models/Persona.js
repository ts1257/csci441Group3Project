import mongoose from "mongoose";

const personaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Persona name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      default: "#3b82f6",
    },
  },
  {
    timestamps: true,
  },
);

const Persona = mongoose.model("Persona", personaSchema);

export default Persona;