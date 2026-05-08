

import Event from "../models/Event.js";

const isScannerFor = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
    }

    // Admins have blanket scanner access to every event
    if (["admin", "superadmin"].includes(req.user.role)) {
      return next();
    }

    const eventId = req.params.eventId || req.body.eventId;
    if (!eventId) {
      return res.status(400).json({ success: false, message: "eventId is required for scanner access." });
    }

    const event = await Event.findById(eventId).select("scanners");
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found." });
    }

    const isAuthorized = event.scanners.some(
      (s) => s.userId.toString() === req.user._id.toString()
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You do not have QR scanning permission for this event.",
      });
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default isScannerFor;
