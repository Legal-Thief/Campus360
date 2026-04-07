import express from "express";
import {
  createEvent,
  getOpenEvents,
  submitQuiz,
  generatePriority,
  getQuiz,
  getMyStatus,
  canBookSeat,
  getSeats,
  lockSeat,
  confirmSeatBooking
} from "../controllers/event.controller.js";
import { protect } from "../middlewares/auth.middleware.js";


const router = express.Router();

router.post("/", createEvent);
router.get("/", getOpenEvents);

router.get("/:id/quiz", getQuiz);              
router.get("/:eventId/priority", generatePriority);

router.post("/:id/submit-quiz", submitQuiz);
router.get("/:eventId/my-status", protect, getMyStatus);
router.get("/:eventId/can-book", protect, canBookSeat);
router.get("/:eventId/seats", protect, getSeats);
router.post("/:eventId/seats/:seatId/lock", protect, lockSeat);
router.post("/:eventId/seats/:seatId/confirm", protect, confirmSeatBooking);
export default router;