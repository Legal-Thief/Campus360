import express from "express";
import { chatController } from "../controllers/chat.controller.js";

const router = express.Router();

// POST /api/chat  — no auth required, anyone can use the navigator
router.post("/chat", chatController);

export default router;
