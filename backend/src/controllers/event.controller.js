import Event from "../models/Event.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Seat from "../models/Seat.js";
import Auditorium from "../models/Auditorium.js";
import SeatBooking from "../models/SeatBooking.js";
import { calculatePriority } from "../services/priority.service.js";
import { assignTimeSlots } from "../services/slot.service.js";
import crypto from "crypto";

// =======================
// CREATE EVENT
// =======================
export const createEvent = async (req, res) => {
  try {
    const {
      title, description, auditoriumId, date,
      registrationDeadline, bookingStart, bookingEnd, quiz,
    } = req.body;

    if (!title || !auditoriumId || !date || !registrationDeadline || !quiz ||
        !quiz.duration || !quiz.questions || quiz.questions.length === 0) {
      return res.status(400).json({ success: false, message: "All required fields must be provided" });
    }

    const auditorium = await Auditorium.findById(auditoriumId);
    if (!auditorium) {
      return res.status(404).json({ success: false, message: "Auditorium not found" });
    }

    const event = await Event.create({
      title,
      description,
      venue: auditorium.name,
      auditoriumId,
      date,
      registrationDeadline,
      bookingStart: bookingStart || null,
      bookingEnd: bookingEnd || null,
      quiz,
      createdBy: req.user.id,  // FIX: track who created the event
    });

    const seats = [];
    auditorium.rows.forEach((row) => {
      for (let i = 1; i <= auditorium.seatsPerRow; i++) {
        const seatNumber = `${row}${i}`;
        seats.push({
          eventId: event._id,
          row,
          number: i,
          seatNumber,
          status: auditorium.blockedSeats.includes(seatNumber) ? "blocked" : "available",
        });
      }
    });

    await Seat.insertMany(seats);

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
      seatsCreated: seats.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GET OPEN EVENTS
// =======================
export const getOpenEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: { $in: ["registration_open", "quiz_closed", "priority_calculated", "seat_selection"] },
    })
      .populate("auditoriumId", "name rows seatsPerRow")
      .select("-quiz.questions.correctAnswerIndex"); // never expose answers

    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GET ALL EVENTS (admin)
// =======================
export const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("auditoriumId", "name")
      .select("-quiz.questions.correctAnswerIndex")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// UPDATE EVENT STATUS (admin)
// =======================
export const updateEventStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { status, bookingStart, bookingEnd } = req.body;

    const validStatuses = [
      "registration_open", "quiz_closed", "priority_calculated",
      "seat_selection", "completed",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const update = { status };
    if (bookingStart) update.bookingStart = bookingStart;
    if (bookingEnd) update.bookingEnd = bookingEnd;

    const event = await Event.findByIdAndUpdate(eventId, update, { new: true });
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GET QUIZ  (answers stripped)
// =======================
export const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (event.status !== "registration_open") {
      return res.status(400).json({ success: false, message: "Quiz is not currently open" });
    }

    // Strip correct answers before sending to client
    const questions = event.quiz.questions.map((q, index) => ({
      question: q.question,
      options: q.options,
      originalQuestionIndex: index,
      // correctAnswerIndex is intentionally excluded
    }));

    res.status(200).json({ success: true, duration: event.quiz.duration, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// SUBMIT QUIZ
// =======================
export const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const { id } = req.params;
    const userId = req.user.id; // FIX: always use token user, never trust body

    if (!answers || answers.length === 0) {
      return res.status(400).json({ success: false, message: "No answers submitted" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    // Check event is still open for quiz
    if (event.status !== "registration_open") {
      return res.status(400).json({ success: false, message: "Quiz is no longer accepting submissions" });
    }

    // Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ success: false, message: "Registration deadline has passed" });
    }

    // Prevent duplicate attempts
    const existing = await QuizAttempt.findOne({ userId, eventId: id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already submitted this quiz" });
    }

    let score = 0;
    answers.forEach((ans) => {
      const question = event.quiz.questions[ans.originalQuestionIndex];
      if (question && question.correctAnswerIndex === ans.originalOptionIndex) {
        score++;
      }
    });

    const attempt = await QuizAttempt.create({
      userId,       // FIX: from token, not body
      eventId: id,
      answers,
      score,
      submittedAt: new Date(),
    });

    res.status(200).json({ success: true, score, attempt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GENERATE PRIORITY + SLOT
// =======================
export const generatePriority = async (req, res) => {
  try {
    const { eventId } = req.params;

    const attempts = await QuizAttempt.find({ eventId });
    if (!attempts.length) {
      return res.status(404).json({ success: false, message: "No quiz attempts found" });
    }

    const priorityList = calculatePriority(attempts);

    for (const p of priorityList) {
      await QuizAttempt.findOneAndUpdate(
        { userId: p.userId, eventId },
        { priority: p.priority }
      );
    }

    const updatedAttempts = await QuizAttempt.find({ eventId }).sort({ priority: 1 });
    const slotData = await assignTimeSlots(updatedAttempts);

    for (const s of slotData) {
      await QuizAttempt.findByIdAndUpdate(s.id, {
        slotStart: s.slotStart,
        slotEnd: s.slotEnd,
      });
    }

    await Event.findByIdAndUpdate(eventId, { status: "priority_calculated" });

    res.status(200).json({
      success: true,
      message: "Priority and slots generated successfully",
      total: attempts.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GET QUIZ ANALYTICS (admin)
// =======================
export const getQuizAnalytics = async (req, res) => {
  try {
    const { eventId } = req.params;

    const attempts = await QuizAttempt.find({ eventId })
      .populate("userId", "name studentId email")
      .sort({ priority: 1 });

    if (!attempts.length) {
      return res.status(200).json({ success: true, attempts: [], stats: null });
    }

    const scores = attempts.map((a) => a.score);
    const stats = {
      total: attempts.length,
      average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      highest: Math.max(...scores),
      lowest: Math.min(...scores),
    };

    res.status(200).json({ success: true, attempts, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GET MY STATUS
// =======================
export const getMyStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id; // FIX: always from token

    const attempt = await QuizAttempt.findOne({ eventId, userId });
    if (!attempt) {
      return res.status(404).json({ success: false, message: "You have not attempted this quiz" });
    }

    const booking = await SeatBooking.findOne({ eventId, userId })
      .populate("seatId", "seatNumber row number");

    res.status(200).json({
      success: true,
      score: attempt.score,
      priority: attempt.priority,
      slotStart: attempt.slotStart,
      slotEnd: attempt.slotEnd,
      booking: booking || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// CAN BOOK SEAT?
// =======================
export const canBookSeat = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id; // FIX: always from token

    const event = await Event.findById(eventId);
    const attempt = await QuizAttempt.findOne({ eventId, userId });

    if (!event || !attempt) {
      return res.status(404).json({ success: false, message: "Event or attempt not found" });
    }

    const now = new Date();

    const existingBooking = await SeatBooking.findOne({ eventId, userId });
    if (existingBooking) {
      return res.status(200).json({
        success: true, allowed: false, reason: "already_booked", booking: existingBooking,
      });
    }

    const withinBookingWindow =
      event.bookingStart && event.bookingEnd
        ? now >= new Date(event.bookingStart) && now <= new Date(event.bookingEnd)
        : true;

    const withinSlot =
      attempt.slotStart && attempt.slotEnd
        ? now >= new Date(attempt.slotStart) && now <= new Date(attempt.slotEnd)
        : false;

    const allowed = withinBookingWindow && withinSlot;

    res.status(200).json({
      success: true, allowed,
      bookingStart: event.bookingStart, bookingEnd: event.bookingEnd,
      slotStart: attempt.slotStart, slotEnd: attempt.slotEnd,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GET ALL SEATS
// =======================
export const getSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const seats = await Seat.find({ eventId }).populate("bookedBy", "name studentId");

    res.status(200).json({ success: true, seats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// LOCK SEAT
// =======================
export const lockSeat = async (req, res) => {
  try {
    const { eventId, seatId } = req.params;
    const userId = req.user.id; // FIX: always from token

    // FIX: verify user has a valid slot before allowing seat lock
    const attempt = await QuizAttempt.findOne({ eventId, userId });
    if (!attempt) {
      return res.status(403).json({ success: false, message: "You have not attempted the quiz for this event" });
    }

    const now = new Date();
    if (!attempt.slotStart || !attempt.slotEnd ||
        now < new Date(attempt.slotStart) || now > new Date(attempt.slotEnd)) {
      return res.status(403).json({ success: false, message: "Your booking slot is not active right now" });
    }

    // FIX: check user doesn't already have a booking
    const existingBooking = await SeatBooking.findOne({ eventId, userId });
    if (existingBooking) {
      return res.status(400).json({ success: false, message: "You already have a seat booked for this event" });
    }

    const seat = await Seat.findOne({ _id: seatId, eventId });
    if (!seat) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }

    if (seat.status === "booked" || seat.status === "blocked") {
      return res.status(400).json({ success: false, message: "This seat cannot be selected" });
    }

    if (
      seat.status === "locked" &&
      seat.bookedBy?.toString() !== userId &&
      seat.lockedUntil && new Date(seat.lockedUntil) > now
    ) {
      return res.status(400).json({ success: false, message: "Seat temporarily locked by another user" });
    }

    seat.status = "locked";
    seat.bookedBy = userId;
    seat.lockedUntil = new Date(Date.now() + 2 * 60 * 1000); // 2 min lock
    await seat.save();

    res.status(200).json({ success: true, seat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// CONFIRM BOOKING + QR
// =======================
export const confirmSeatBooking = async (req, res) => {
  try {
    const { eventId, seatId } = req.params;
    const userId = req.user.id; // FIX: always from token

    const seat = await Seat.findOne({ _id: seatId, eventId });
    if (!seat) {
      return res.status(404).json({ success: false, message: "Seat not found" });
    }

    if (seat.status !== "locked") {
      return res.status(400).json({ success: false, message: "Seat is not locked" });
    }

    if (seat.bookedBy?.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You do not own this seat lock" });
    }

    if (!seat.lockedUntil || new Date(seat.lockedUntil) < new Date()) {
      seat.status = "available";
      seat.bookedBy = null;
      seat.lockedUntil = null;
      await seat.save();
      return res.status(400).json({ success: false, message: "Seat lock expired. Please select again." });
    }

    // FIX: check duplicate booking at confirm time too (race condition safety)
    const existingBooking = await SeatBooking.findOne({ eventId, userId });
    if (existingBooking) {
      return res.status(400).json({ success: false, message: "You already have a booking for this event" });
    }

    seat.status = "booked";
    seat.lockedUntil = null;
    await seat.save();

    const qrToken = crypto.randomBytes(32).toString("hex"); // FIX: 32 bytes = stronger token

    const booking = await SeatBooking.create({
      userId,
      eventId,
      seatId: seat._id,
      seatNumber: seat.seatNumber,
      qrToken,
      status: "confirmed",
    });

    res.status(200).json({
      success: true, message: "Seat booked successfully",
      seat, booking, qrToken,
    });
  } catch (error) {
    // Handle unique index violation on (userId, eventId)
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You already have a booking for this event" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};


// =======================
// ASSIGN SCANNERS (admin)
// =======================
export const assignScanners = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userIds } = req.body; // array of user IDs to grant scanning access

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "Provide an array of userIds." });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const existingIds = event.scanners.map((s) => s.userId.toString());
    const newEntries = userIds
      .filter((id) => !existingIds.includes(id.toString()))
      .map((id) => ({ userId: id, grantedBy: req.user._id, grantedAt: new Date() }));

    event.scanners.push(...newEntries);
    await event.save();

    const populated = await Event.findById(eventId)
      .populate("scanners.userId", "name studentId email role")
      .select("scanners title");

    res.status(200).json({
      success: true,
      message: `${newEntries.length} scanner(s) added.`,
      scanners: populated.scanners,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// REMOVE SCANNER (admin)
// =======================
export const removeScanner = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const before = event.scanners.length;
    event.scanners = event.scanners.filter((s) => s.userId.toString() !== userId);

    if (event.scanners.length === before) {
      return res.status(404).json({ success: false, message: "Scanner not found for this event." });
    }

    await event.save();
    res.status(200).json({ success: true, message: "Scanner access revoked." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GET EVENT SCANNERS (admin)
// =======================
export const getEventScanners = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate("scanners.userId", "name studentId email role")
      .populate("scanners.grantedBy", "name")
      .select("scanners title clubName");

    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    res.status(200).json({ success: true, scanners: event.scanners, eventTitle: event.title });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GET MY ASSIGNED SCANNER EVENTS
// =======================
export const getMyScannerEvents = async (req, res) => {
  try {
    const userId = req.user._id;

    const events = await Event.find({ "scanners.userId": userId })
      .populate("auditoriumId", "name")
      .select("title date venue status clubName scanners");

    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// QR SCAN
// =======================
export const scanQR = async (req, res) => {
  try {
    const { qrToken, eventId } = req.body;

    if (!qrToken) {
      return res.status(400).json({ success: false, message: "QR token required" });
    }
    if (!eventId) {
      return res.status(400).json({ success: false, message: "eventId is required" });
    }

    const booking = await SeatBooking.findOne({ qrToken })
      .populate("userId", "name studentId")
      .populate("eventId", "title date")
      .populate("seatId", "seatNumber row");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Invalid QR code" });
    }

    // Ensure the scanned QR belongs to the event the scanner is authorised for
    if (booking.eventId?._id?.toString() !== eventId.toString()) {
      return res.status(403).json({
        success: false,
        message: "This QR code does not belong to your assigned event.",
      });
    }

    const now = new Date();
    let scanType = "";
    let message = "";

    if (!booking.entryTime) {
      booking.entryTime = now;
      booking.status = "present";
      scanType = "entry";
      message = "Entry confirmed";
    } else if (!booking.exitTime && booking.status === "present") {
      if (booking.breakUsed) {
        return res.status(400).json({ success: false, message: "Break already used" });
      }
      booking.exitTime = now;
      booking.status = "on_break";
      scanType = "exit";
      message = "Break started — please return within the allowed time";
    } else if (booking.exitTime && booking.status === "on_break") {
      booking.reEntryTime = now;
      booking.status = "present";
      booking.breakUsed = true;
      scanType = "reentry";
      message = "Re-entry confirmed — welcome back";
    } else {
      return res.status(400).json({ success: false, message: "Invalid scan state" });
    }

    await booking.save();

    res.status(200).json({
      success: true, scanType, message,
      booking: {
        studentName: booking.userId?.name,
        studentId: booking.userId?.studentId,
        seatNumber: booking.seatNumber,
        eventTitle: booking.eventId?.title,
        status: booking.status,
        entryTime: booking.entryTime,
        exitTime: booking.exitTime,
        reEntryTime: booking.reEntryTime,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// GET MY BOOKING
// =======================
export const getMyBooking = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    const booking = await SeatBooking.findOne({ eventId, userId })
      .populate("seatId", "seatNumber row number");

    if (!booking) {
      return res.status(404).json({ success: false, message: "No booking found" });
    }

    res.status(200).json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// PROCESS EXPIRED SEATS
// =======================
export const processExpiredSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const BREAK_LIMIT_MINUTES = 15;
    const now = new Date();
    const cutoff = new Date(now.getTime() - BREAK_LIMIT_MINUTES * 60 * 1000);

    const expiredBreaks = await SeatBooking.find({
      eventId, status: "on_break", exitTime: { $lte: cutoff },
    });

    let freed = 0;
    for (const booking of expiredBreaks) {
      booking.status = "break_expired";
      await booking.save();

      await Seat.findByIdAndUpdate(booking.seatId, {
        status: "available", bookedBy: null,
      });

      freed++;
    }

    res.status(200).json({
      success: true,
      message: `${freed} expired break seat(s) freed`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// EVENT REPORT (admin)
// =======================
export const getEventReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("auditoriumId", "name rows seatsPerRow");
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const [seats, bookings, attempts] = await Promise.all([
      Seat.find({ eventId }),
      SeatBooking.find({ eventId }).populate("userId", "name studentId email"),
      QuizAttempt.find({ eventId }),
    ]);

    const seatStats = {
      total: seats.length,
      available: seats.filter((s) => s.status === "available").length,
      booked: seats.filter((s) => s.status === "booked").length,
      blocked: seats.filter((s) => s.status === "blocked").length,
      locked: seats.filter((s) => s.status === "locked").length,
    };

    const attendanceStats = {
      totalBookings: bookings.length,
      present: bookings.filter((b) => b.status === "present").length,
      onBreak: bookings.filter((b) => b.status === "on_break").length,
      breakExpired: bookings.filter((b) => b.status === "break_expired").length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
    };

    res.status(200).json({
      success: true, event, seatStats, attendanceStats,
      quizParticipants: attempts.length, bookings,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
