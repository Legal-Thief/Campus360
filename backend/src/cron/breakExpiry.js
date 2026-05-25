import cron from "node-cron";
import SeatBooking from "../models/SeatBooking.js";
import Seat from "../models/Seat.js";
import { autoAssignFromWaitlist } from "../controllers/event.controller.js";

const BREAK_LIMIT_MINUTES = 10;

/**
 * Runs every 5 minutes.
 * Finds all on_break bookings whose exitTime is > 15 minutes ago,
 * marks them break_expired, frees the seat, then triggers waitlist auto-assign.
 */
const runBreakExpiry = async () => {
  try {
    const now    = new Date();
    const cutoff = new Date(now.getTime() - BREAK_LIMIT_MINUTES * 60 * 1000);

    // Find ALL expired breaks across every active event
    const expiredBreaks = await SeatBooking.find({
      status:   "on_break",
      exitTime: { $lte: cutoff },
    });

    if (expiredBreaks.length === 0) {
      console.log(`[BreakExpiry Cron] ${now.toISOString()} — No expired breaks found.`);
      return;
    }

    let freed = 0;

    for (const booking of expiredBreaks) {
      // Mark booking as expired
      booking.status = "break_expired";
      await booking.save();

      // Free the seat
      const seat = await Seat.findByIdAndUpdate(
        booking.seatId,
        { status: "available", bookedBy: null },
        { new: true }
      );

      freed++;

      // Attempt to auto-assign the freed seat to the next waitlist student
      if (seat) {
        try {
          await autoAssignFromWaitlist(booking.eventId.toString(), seat);
        } catch (assignErr) {
          console.error(
            `[BreakExpiry Cron] autoAssign failed for event ${booking.eventId}:`,
            assignErr.message
          );
        }
      }
    }

    console.log(
      `[BreakExpiry Cron] ${now.toISOString()} — Freed ${freed} seat(s) across all events.`
    );
  } catch (err) {
    console.error("[BreakExpiry Cron] Error during run:", err.message);
  }
};

/**
 * Starts the cron job. Call this once when the server boots.
 * Schedule: every 5 minutes.
 */
export const startBreakExpiryCron = () => {
  cron.schedule("*/5 * * * *", runBreakExpiry);
  console.log("[BreakExpiry Cron] Scheduled — runs every 5 minutes.");
};
