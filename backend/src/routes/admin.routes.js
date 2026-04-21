import express from "express";
import {
  adminDashboard,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllEventsForAdmin,
} from "../controllers/admin.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// Admin + Superadmin dashboard
router.get(
  "/dashboard",
  protect,
  roleMiddleware("admin", "superadmin"),
  adminDashboard
);

// Admin + Superadmin can see all users
router.get(
  "/users",
  protect,
  roleMiddleware("admin", "superadmin"),
  getAllUsers
);

// Only superadmin can change user role
router.patch(
  "/users/:id/role",
  protect,
  roleMiddleware("superadmin"),
  updateUserRole
);

// Only superadmin can delete users
router.delete(
  "/users/:id",
  protect,
  roleMiddleware("superadmin"),
  deleteUser
);

// Admin + Superadmin can see all events
router.get(
  "/events",
  protect,
  roleMiddleware("admin", "superadmin"),
  getAllEventsForAdmin
);

export default router;