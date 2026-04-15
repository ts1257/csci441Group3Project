import express from "express";
import {
  createRecord,
  deleteRecord,
  getRecords,
  updateRecord,
} from "../controllers/recordController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getRecords).post(createRecord);
router.route("/:id").patch(updateRecord).delete(deleteRecord);

export default router;
