import express from "express";
import {
  createHabit,
  deleteHabit,
  getHabits,
  updateHabit,
} from "../controllers/habitController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getHabits).post(createHabit);
router.route("/:id").patch(updateHabit).delete(deleteHabit);

export default router;
