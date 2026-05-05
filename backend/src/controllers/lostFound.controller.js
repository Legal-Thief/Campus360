import LostFoundItem from "../models/LostFoundItem.js";

// ========================
// POST /api/lost-found/add
// Any authenticated user
// ========================
export const addItem = async (req, res) => {
  try {
    const {
      type, title, category, description,
      location, date, imageUrl,
      studentId, studentName, mobileNumber, address,
    } = req.body;

    if (!type || !title || !category || !location || !date || !studentId || !mobileNumber) {
      return res.status(400).json({ success: false, message: "All required fields must be filled" });
    }

    if (!["lost", "found"].includes(type)) {
      return res.status(400).json({ success: false, message: "Type must be lost or found" });
    }

    const item = await LostFoundItem.create({
      type, title, category: category.toLowerCase(),
      description, location, date, imageUrl: imageUrl || null,
      reportedBy: req.user?.id || null,
      studentId, studentName, mobileNumber, address,
      status: "pending",
    });

    res.status(201).json({ success: true, message: "Item submitted for admin approval", item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// GET /api/lost-found/lost
// Public - approved lost items
// ========================
export const getLostItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { type: "lost", status: "approved", resolved: false };

    if (category && category !== "all") filter.category = category;
    if (search) filter.title = { $regex: search, $options: "i" };

    const items = await LostFoundItem.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// GET /api/lost-found/found
// Public - approved found items
// ========================
export const getFoundItems = async (req, res) => {
  try {
    const { category, search } = req.query;
    const filter = { type: "found", status: "approved", resolved: false };

    if (category && category !== "all") filter.category = category;
    if (search) filter.title = { $regex: search, $options: "i" };

    const items = await LostFoundItem.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// GET /api/lost-found/all
// Admin only - all items
// ========================
export const getAllItems = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const items = await LostFoundItem.find(filter)
      .populate("reportedBy", "name email")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// PUT /api/lost-found/status/:id
// Admin only
// ========================
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const item = await LostFoundItem.findByIdAndUpdate(
      id,
      { status, adminNote: adminNote || "", reviewedBy: req.user.id },
      { new: true }
    );

    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    res.status(200).json({ success: true, message: `Item ${status}`, item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// PUT /api/lost-found/resolve/:id
// Admin only
// ========================
export const resolveItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await LostFoundItem.findByIdAndUpdate(
      id,
      { resolved: true, resolvedAt: new Date(), reviewedBy: req.user.id },
      { new: true }
    );

    if (!item) return res.status(404).json({ success: false, message: "Item not found" });

    res.status(200).json({ success: true, message: "Item marked as resolved", item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ========================
// GET /api/lost-found/stats
// Admin only
// ========================
export const getStats = async (req, res) => {
  try {
    const [total, pending, approved, resolved, lostCount, foundCount] = await Promise.all([
      LostFoundItem.countDocuments(),
      LostFoundItem.countDocuments({ status: "pending" }),
      LostFoundItem.countDocuments({ status: "approved", resolved: false }),
      LostFoundItem.countDocuments({ resolved: true }),
      LostFoundItem.countDocuments({ type: "lost", status: "approved", resolved: false }),
      LostFoundItem.countDocuments({ type: "found", status: "approved", resolved: false }),
    ]);

    res.status(200).json({ success: true, stats: { total, pending, approved, resolved, lostCount, foundCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
