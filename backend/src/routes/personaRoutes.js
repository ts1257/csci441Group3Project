import express from "express";
import {
  createPersona,
  deletePersona,
  getPersonas,
  updatePersona,
} from "../controllers/personaController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").get(getPersonas).post(createPersona);
router.route("/:id").put(updatePersona).delete(deletePersona);

export default router;