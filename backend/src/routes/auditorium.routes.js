import express from "express";
import {
  createAuditorium,
  getAllAuditoriums,
  getAuditoriumById,
} from "../controllers/auditorium.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// Only admin/superadmin can create auditoriums
router.post("/", protect, roleMiddleware("admin", "superadmin"), createAuditorium);

// Anyone authenticated can view
router.get("/", protect, getAllAuditoriums);
router.get("/:id", protect, getAuditoriumById);

export default router;
