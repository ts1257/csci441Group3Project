import express from "express";
import {
  deleteAdminDataItem,
  deleteAdminTask,
  deleteUser,
  getAdminData,
  getAdminStats,
  getAdminTasks,
  getAdminUsers,
  updateAdminDataItem,
  updateUserRole,
} from "../controllers/adminController.js";
import { adminOnly, protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/stats", getAdminStats);
router.get("/users", getAdminUsers);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);
router.get("/tasks", getAdminTasks);
router.delete("/tasks/:id", deleteAdminTask);
router.get("/data", getAdminData);
router.patch("/data/:resource/:id", updateAdminDataItem);
router.delete("/data/:resource/:id", deleteAdminDataItem);

export default router;
