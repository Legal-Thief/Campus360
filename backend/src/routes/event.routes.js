import express from "express";
import {
  createEvent,
  getOpenEvents,
  getAllEvents,
  updateEventStatus,
  submitQuiz,
  generatePriority,
  getQuiz,
  getMyStatus,
  canBookSeat,
  getSeats,
  lockSeat,
  confirmSeatBooking,
  getMyBooking,
  scanQR,
  processExpiredSeats,
  getEventReport,
  getQuizAnalytics,
} from "../controllers/event.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// Create Event -> only faculty/admin/superadmin
router.post(
  "/",
  protect,
  roleMiddleware("faculty", "admin", "superadmin"),
  createEvent
);

// Public event routes
router.get("/", getOpenEvents);
router.get("/all", getAllEvents);

// QR scan (keep public if scanner device does not login)
router.post("/scan-qr", scanQR);

// Quiz
router.get("/:id/quiz", getQuiz);

router.post(
  "/:id/submit-quiz",
  protect,
  roleMiddleware("student"),
  submitQuiz
);

// Priority generation -> only student
router.get(
  "/:eventId/priority",
  protect,
  roleMiddleware("admin", "superadmin"),
  generatePriority
);

// Student status & booking
router.get(
  "/:eventId/my-status",
  protect,
  roleMiddleware("student"),
  getMyStatus
);

router.get(
  "/:eventId/my-booking",
  protect,
  roleMiddleware("student"),
  getMyBooking
);

router.get(
  "/:eventId/can-book",
  protect,
  roleMiddleware("student"),
  canBookSeat
);

router.get(
  "/:eventId/seats",
  protect,
  roleMiddleware("student"),
  getSeats
);

router.post(
  "/:eventId/seats/:seatId/lock",
  protect,
  roleMiddleware("student"),
  lockSeat
);

router.post(
  "/:eventId/seats/:seatId/confirm",
  protect,
  roleMiddleware("student"),
  confirmSeatBooking
);

// Admin / Superadmin only
router.patch(
  "/:eventId/status",
  protect,
  roleMiddleware("admin", "superadmin"),
  updateEventStatus
);

router.get(
  "/:eventId/analytics",
  protect,
  roleMiddleware("admin", "superadmin"),
  getQuizAnalytics
);

router.get(
  "/:eventId/report",
  protect,
  roleMiddleware("admin", "superadmin"),
  getEventReport
);

router.post(
  "/:eventId/process-expired",
  protect,
  roleMiddleware("admin", "superadmin"),
  processExpiredSeats
);

export default router;