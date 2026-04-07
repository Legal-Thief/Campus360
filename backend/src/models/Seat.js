import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    row: {
      type: String,
      required: true,
    },

    number: {
      type: Number,
      required: true,
    },

    seatNumber: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["available", "locked", "booked", "blocked"],
      default: "available",
    },

    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    lockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Seat", seatSchema);