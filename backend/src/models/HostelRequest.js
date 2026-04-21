import mongoose from "mongoose";

const hostelRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["room_change", "room_swap"],
      required: true,
    },

    // Requester's current room
    currentBlock: { type: String, required: true },
    currentRoom: { type: String, required: true },

    // Preferred room (optional, for room_change)
    preferredBlock: { type: String, default: null },
    preferredRoom: { type: String, default: null },

    reason: { type: String, required: true },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    // Warden review
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    wardenNote: { type: String, default: "" },

    // Swap partner details (for room_swap)
    swapWithUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    swapWithBlock: { type: String, default: null },
    swapWithRoom: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("HostelRequest", hostelRequestSchema);
