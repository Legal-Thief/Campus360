import express from "express";
import {
  createEvent,
  getOpenEvents,
  submitQuiz,
  generatePriority,
  getQuiz,
} from "../controllers/event.controller.js";

const router = express.Router();

router.post("/", createEvent);
router.get("/", getOpenEvents);

router.get("/:id/quiz", getQuiz);              
router.get("/:eventId/priority", generatePriority);

router.post("/:id/submit-quiz", submitQuiz);

export default router;