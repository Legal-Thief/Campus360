import mongoose from "mongoose";

const seatBookingSchema = new mongoose.Schema(
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
    seatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seat",
      required: true,
    },
    seatNumber: {
      type: String,
      required: true,
    },

    // QR Code token (unique hex string)
    qrToken: {
      type: String,
      required: true,
      unique: true,
    },

    // Booking status lifecycle
    status: {
      type: String,
      enum: ["confirmed", "present", "on_break", "break_expired", "absent"],
      default: "confirmed",
    },

    // Entry/exit timestamps (QR scan events)
    entryTime:   { type: Date, default: null },
    exitTime:    { type: Date, default: null },    // break start
    reEntryTime: { type: Date, default: null },    // break end

    // Whether the one allowed break has been used
    breakUsed: { type: Boolean, default: false },

    // OD / Attendance tracking (Feature 3)
    attendedMinutes: { type: Number, default: 0 },
    odIssued:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure one booking per user per event
seatBookingSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model("SeatBooking", seatBookingSchema);
