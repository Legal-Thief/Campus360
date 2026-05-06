import express from "express";
import {
  addItem,
  getLostItems,
  getFoundItems,
  getAllItems,
  updateStatus,
  resolveItem,
  getStats,
} from "../controllers/lostFound.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// Public (approved items visible to all students)
router.get("/lost", getLostItems);
router.get("/found", getFoundItems);

// Any logged-in user can report
router.post("/add", protect, addItem);

// Lost & Found admin + superadmin only
router.get("/all",           protect, roleMiddleware("lostfound_admin", "superadmin"), getAllItems);
router.get("/stats",         protect, roleMiddleware("lostfound_admin", "superadmin"), getStats);
router.put("/status/:id",    protect, roleMiddleware("lostfound_admin", "superadmin"), updateStatus);
router.put("/resolve/:id",   protect, roleMiddleware("lostfound_admin", "superadmin"), resolveItem);

export default router;