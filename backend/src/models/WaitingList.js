import mongoose from "mongoose";

const waitingListSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    // Lower number = higher priority (quiz rank)
    priority: {
      type: Number,
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One entry per user per event
waitingListSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model("WaitingList", waitingListSchema);
