import express from "express";
import cors from "cors";
import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import personaRoutes from "./routes/personaRoutes.js";
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

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

export default app;