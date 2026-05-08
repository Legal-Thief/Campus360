import User from "../models/User.js";
import Event from "../models/Event.js";

// ========================
// Admin Dashboard stats
// ========================
export const adminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalEvents, hostellers, dayScholars] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      User.countDocuments({ residentType: "hosteller" }),
      User.countDocuments({ residentType: "day_scholar" }),
    ]);

    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalEvents,
        hostellers,
        dayScholars,
        usersByRole,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// Get all users
// ========================
export const getAllUsers = async (req, res) => {
  try {
    const { role, residentType, search } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (residentType) filter.residentType = residentType;

    // Text search across name, studentId and email
    if (search && search.trim()) {
      const rx = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: rx },
        { studentId: rx },
        { email: rx },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .limit(search ? 20 : 0)   // cap results when searching
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// Update user role (superadmin only)
// ========================
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ["student", "faculty", "warden", "admin", "superadmin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }

    // Prevent superadmin from changing their own role
    if (id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot change your own role" });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, select: "-password" }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: `Role updated to ${role}`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// Delete user (superadmin only)
// ========================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot delete your own account" });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// Get all events (admin view)
// ========================
export const getAllEventsForAdmin = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
