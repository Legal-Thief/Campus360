import express from "express";
import {
  createRequest,
  getMyRequests,
  cancelRequest,
  offerSwap,
  getAllRequests,
  reviewRequest,
  getHostelSummary,
  getOpenSwapRequests,
} from "../controllers/hostel.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import roleMiddleware from "../middlewares/role.middleware.js";

const router = express.Router();

// Student routes
router.post("/requests", protect, roleMiddleware("student"), createRequest);
router.get("/requests/my", protect, roleMiddleware("student"), getMyRequests);
router.get("/requests/open-swaps", protect, roleMiddleware("student"), getOpenSwapRequests);
router.patch("/requests/:requestId/swap-offer", protect, roleMiddleware("student"), offerSwap);
router.delete("/requests/:requestId", protect, roleMiddleware("student"), cancelRequest);

//  Warden routes 
router.get("/requests", protect, roleMiddleware("warden", "admin", "superadmin"), getAllRequests);
router.patch("/requests/:requestId/review", protect, roleMiddleware("warden", "admin", "superadmin"), reviewRequest);
router.get("/summary", protect, roleMiddleware("warden", "admin", "superadmin"), getHostelSummary);

export default router;
