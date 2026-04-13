import dotenv from "dotenv";
dotenv.config();

import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const { default: app } = await import("./app.js");

    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
