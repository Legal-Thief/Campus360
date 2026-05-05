import mongoose from "mongoose";

const lostFoundSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["lost", "found"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["electronics", "clothing", "accessories", "books", "id_card", "keys", "wallet", "bag", "other"],
      required: true,
    },
    description: { type: String, default: "" },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true },
    imageUrl: { type: String, default: null },

    // Reporter details
    reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    studentId: { type: String, required: true },
    studentName: { type: String, default: "" },
    mobileNumber: { type: String, required: true },
    address: { type: String, default: "" },

    // Admin workflow
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date, default: null },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

// Index for fast queries
lostFoundSchema.index({ type: 1, status: 1, resolved: 1 });
lostFoundSchema.index({ studentId: 1 });

export default mongoose.model("LostFoundItem", lostFoundSchema);
