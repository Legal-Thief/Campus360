import express from "express";
import {
  createAuditorium,
  getAllAuditoriums,
  getAuditoriumById,
} from "../controllers/auditorium.controller.js";

const router = express.Router();

router.post("/", createAuditorium);
router.get("/", getAllAuditoriums);
router.get("/:id", getAuditoriumById);

export default router;