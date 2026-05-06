import express from "express";
import cors from "cors";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import personaRoutes from "./routes/personaRoutes.js";
import plannedPaymentRoutes from "./routes/plannedPaymentRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import habitRoutes from "./routes/habitRoutes.js";
import tripRoutes from "./routes/tripRoutes.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

const app = express();

// Allow requests from the frontend app
app.use(
  cors({
    origin: [process.env.CLIENT_URL],
    credentials: true,
  }),
);

// Parse JSON request bodies
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to Multi-Persona Planner API",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/personas", personaRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/planned-payments", plannedPaymentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/trips", tripRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;
