import express from "express";
import {
  createPlannedPayment,
  deletePlannedPayment,
  getPlannedPayments,
  updatePlannedPayment,
} from "../controllers/plannedPaymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getPlannedPayments).post(createPlannedPayment);
router.route("/:id").patch(updatePlannedPayment).delete(deletePlannedPayment);

export default router;
