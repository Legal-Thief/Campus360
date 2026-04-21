import HostelRequest from "../models/HostelRequest.js";
import User from "../models/User.js";

// ========================
// STUDENT: Raise a request
// ========================
export const createRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, preferredBlock, preferredRoom, reason } = req.body;

    if (!type || !reason) {
      return res.status(400).json({ success: false, message: "Type and reason are required" });
    }

    const student = await User.findById(userId);

    if (student.residentType !== "hosteller") {
      return res.status(403).json({
        success: false,
        message: "Only hostellers can raise hostel requests",
      });
    }

    if (!student.hostelBlock || !student.roomNumber) {
      return res.status(400).json({
        success: false,
        message: "Your hostel block and room are not set. Contact admin.",
      });
    }

    // Check for existing pending request
    const existing = await HostelRequest.findOne({ requestedBy: userId, status: "pending" });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending request",
      });
    }

    const request = await HostelRequest.create({
      requestedBy: userId,
      type,
      currentBlock: student.hostelBlock,
      currentRoom: student.roomNumber,
      preferredBlock: preferredBlock || null,
      preferredRoom: preferredRoom || null,
      reason,
    });

    res.status(201).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// STUDENT: Get my requests
// ========================
export const getMyRequests = async (req, res) => {
  try {
    const requests = await HostelRequest.find({ requestedBy: req.user.id })
      .populate("swapWithUser", "name studentId roomNumber hostelBlock")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// STUDENT: Cancel a pending request
// ========================
export const cancelRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await HostelRequest.findOne({
      _id: requestId,
      requestedBy: req.user.id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found or already reviewed" });
    }

    await request.deleteOne();
    res.status(200).json({ success: true, message: "Request cancelled" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// STUDENT: Offer to swap (respond to another student's swap request)
// ========================
export const offerSwap = async (req, res) => {
  try {
    const { requestId } = req.params;
    const offeredBy = req.user.id;

    const offerer = await User.findById(offeredBy);
    if (offerer.residentType !== "hosteller") {
      return res.status(403).json({ success: false, message: "Only hostellers can offer swaps" });
    }

    const request = await HostelRequest.findById(requestId);
    if (!request || request.type !== "room_swap" || request.status !== "pending") {
      return res.status(404).json({ success: false, message: "Swap request not found" });
    }

    if (request.requestedBy.toString() === offeredBy) {
      return res.status(400).json({ success: false, message: "Cannot swap with yourself" });
    }

    request.swapWithUser = offeredBy;
    request.swapWithBlock = offerer.hostelBlock;
    request.swapWithRoom = offerer.roomNumber;
    await request.save();

    res.status(200).json({ success: true, message: "Swap offer submitted for warden review", request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// WARDEN: Get all requests (with filters)
// ========================
export const getAllRequests = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const requests = await HostelRequest.find(filter)
      .populate("requestedBy", "name studentId hostelBlock roomNumber email")
      .populate("swapWithUser", "name studentId hostelBlock roomNumber")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// WARDEN: Approve or reject a request
// ========================
export const reviewRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, wardenNote } = req.body;
    const wardenId = req.user.id;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status must be approved or rejected" });
    }

    const request = await HostelRequest.findById(requestId)
      .populate("requestedBy")
      .populate("swapWithUser");

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ success: false, message: "Request already reviewed" });
    }

    request.status = status;
    request.wardenNote = wardenNote || "";
    request.reviewedBy = wardenId;
    request.reviewedAt = new Date();
    await request.save();

    // If approved → update user room info in DB
    if (status === "approved") {
      if (request.type === "room_change") {
        await User.findByIdAndUpdate(request.requestedBy._id, {
          hostelBlock: request.preferredBlock || request.currentBlock,
          roomNumber: request.preferredRoom || request.currentRoom,
        });
      }

      if (request.type === "room_swap" && request.swapWithUser) {
        // Swap both users' rooms
        const userA = request.requestedBy;
        const userB = request.swapWithUser;

        await User.findByIdAndUpdate(userA._id, {
          hostelBlock: request.swapWithBlock,
          roomNumber: request.swapWithRoom,
        });
        await User.findByIdAndUpdate(userB._id, {
          hostelBlock: request.currentBlock,
          roomNumber: request.currentRoom,
        });
      }
    }

    res.status(200).json({ success: true, message: `Request ${status}`, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// WARDEN: Get hostel summary (all hostellers)
// ========================
export const getHostelSummary = async (req, res) => {
  try {
    const hostellers = await User.find({ residentType: "hosteller" })
      .select("name studentId hostelBlock roomNumber email")
      .sort({ hostelBlock: 1, roomNumber: 1 });

    const pending = await HostelRequest.countDocuments({ status: "pending" });
    const approved = await HostelRequest.countDocuments({ status: "approved" });
    const rejected = await HostelRequest.countDocuments({ status: "rejected" });

    // Group by block
    const blocks = {};
    hostellers.forEach((h) => {
      const block = h.hostelBlock || "Unassigned";
      if (!blocks[block]) blocks[block] = [];
      blocks[block].push(h);
    });

    res.status(200).json({
      success: true,
      stats: { total: hostellers.length, pending, approved, rejected },
      blocks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// WARDEN / ADMIN: Get open swap requests (for students to respond to)
// ========================
export const getOpenSwapRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await HostelRequest.find({
      type: "room_swap",
      status: "pending",
      swapWithUser: null,
      requestedBy: { $ne: userId },
    })
      .populate("requestedBy", "name studentId hostelBlock roomNumber")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
