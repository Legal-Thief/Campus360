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
  assignScanners,
  removeScanner,
  getEventScanners,
  getMyScannerEvents,
} from "../controllers/event.controller.js";

import { protect } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";
import isScannerFor from "../middlewares/scanner.middleware.js";

const router = express.Router();

// Event creation
router.post("/", protect, roleMiddleware("faculty", "admin", "superadmin"), createEvent);

// Public event listings
router.get("/", getOpenEvents);
router.get("/all", getAllEvents);

// Scanner: events assigned to the logged-in user
router.get("/my-scanner-events", protect, getMyScannerEvents);

// QR Scan — protected + event-scoped (body must include { qrToken, eventId })
router.post("/:eventId/scan-qr", protect, isScannerFor, scanQR);

// Quiz
router.get("/:id/quiz", getQuiz);
router.post("/:id/submit-quiz", protect, roleMiddleware("student"), submitQuiz);

// Priority generation
router.get("/:eventId/priority", protect, roleMiddleware("admin", "superadmin"), generatePriority);

// Student status & booking
router.get("/:eventId/my-status",  protect, roleMiddleware("student"), getMyStatus);
router.get("/:eventId/my-booking", protect, roleMiddleware("student"), getMyBooking);
router.get("/:eventId/can-book",   protect, roleMiddleware("student"), canBookSeat);
router.get("/:eventId/seats",      protect, roleMiddleware("student"), getSeats);
router.post("/:eventId/seats/:seatId/lock",    protect, roleMiddleware("student"), lockSeat);
router.post("/:eventId/seats/:seatId/confirm", protect, roleMiddleware("student"), confirmSeatBooking);

// Admin / Superadmin
router.patch("/:eventId/status",          protect, roleMiddleware("admin", "superadmin"), updateEventStatus);
router.get("/:eventId/analytics",         protect, roleMiddleware("admin", "superadmin"), getQuizAnalytics);
router.get("/:eventId/report",            protect, roleMiddleware("admin", "superadmin"), getEventReport);
router.post("/:eventId/process-expired",  protect, roleMiddleware("admin", "superadmin"), processExpiredSeats);

// Scanner management (admin only)
router.get("/:eventId/scanners",              protect, roleMiddleware("admin", "superadmin"), getEventScanners);
router.post("/:eventId/scanners",             protect, roleMiddleware("admin", "superadmin"), assignScanners);
router.delete("/:eventId/scanners/:userId",   protect, roleMiddleware("admin", "superadmin"), removeScanner);

export default router;
