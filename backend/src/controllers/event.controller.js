import Event from "../models/Event.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Seat from "../models/Seat.js";
import Auditorium from "../models/Auditorium.js";
import SeatBooking from "../models/SeatBooking.js";
import WaitingList from "../models/WaitingList.js";
import { calculatePriority } from "../services/priority.service.js";
import { assignTimeSlots } from "../services/slot.service.js";
import crypto from "crypto";


// ─── HELPER: AUTO-ASSIGN FROM WAITLIST ───────────────────────────────────────
/**
 * When a seat becomes available for an event, find the top-priority student on
 * the waitlist, create a SeatBooking for them, and remove them from the list.
 *
 * @param {string}   eventId - Mongoose ObjectId string for the event
 * @param {Document} seat    - The freed Seat document (must be in "available" state)
 * @returns {Document|null}  - The new SeatBooking, or null if waitlist is empty
 */
export const autoAssignFromWaitlist = async (eventId, seat) => {
  // Find the highest-priority (lowest priority number) student waiting
  const next = await WaitingList.findOne({ eventId })
    .sort({ priority: 1, joinedAt: 1 })
    .populate("userId", "name studentId email");

  if (!next) return null; // nobody waiting

  // Mark seat as booked
  seat.status   = "booked";
  seat.bookedBy = next.userId._id;
  await seat.save();

  // Create a new booking with a fresh QR token
  const qrToken  = crypto.randomBytes(32).toString("hex");
  const newBooking = await SeatBooking.create({
    userId:     next.userId._id,
    eventId,
    seatId:     seat._id,
    seatNumber: seat.seatNumber,
    qrToken,
    status:     "confirmed",
  });

  // Remove from waitlist
  await WaitingList.findByIdAndDelete(next._id);

  console.log(
    `[WaitlistAssign] Seat ${seat.seatNumber} auto-assigned to user ${next.userId._id} for event ${eventId}`
  );

  return newBooking;
};


// ─── HELPER: OD CALCULATION ──────────────────────────────────────────────────
/**
 * Calculate how many minutes a student actually attended.
 *
 * @param {Document} booking      - SeatBooking document
 * @param {Date}     eventEndTime - When the event officially ended
 * @returns {number} minutes attended (integer)
 */
export const calculateAttendedMinutes = (booking, eventEndTime) => {
  const end = new Date(eventEndTime);

  // Never entered
  if (!booking.entryTime) return 0;

  const entry = new Date(booking.entryTime);

  // Entered, no break taken
  if (!booking.exitTime) {
    return Math.max(0, Math.round((end - entry) / 60000));
  }

  const breakStart = new Date(booking.exitTime);

  // Took break and came back (status present after re-entry)
  if (booking.reEntryTime) {
    const reEntry = new Date(booking.reEntryTime);
    const part1   = Math.max(0, breakStart - entry);
    const part2   = Math.max(0, end - reEntry);
    return Math.round((part1 + part2) / 60000);
  }

  // Took break and never came back (break_expired or still on_break at finalize)
  return Math.max(0, Math.round((breakStart - entry) / 60000));
};


// ─── CREATE EVENT ─────────────────────────────────────────────────────────────
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
      bookingEnd:   bookingEnd   || null,
      quiz,
      createdBy: req.user.id,
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


// ─── GET OPEN EVENTS ──────────────────────────────────────────────────────────
export const getOpenEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: { $in: ["registration_open", "quiz_closed", "priority_calculated", "seat_selection"] },
    })
      .populate("auditoriumId", "name rows seatsPerRow")
      .select("-quiz.questions.correctAnswerIndex");

    res.status(200).json({ success: true, events });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── GET ALL EVENTS (admin) ───────────────────────────────────────────────────
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


// ─── UPDATE EVENT STATUS (admin) ──────────────────────────────────────────────
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
    if (bookingEnd)   update.bookingEnd   = bookingEnd;

    const event = await Event.findByIdAndUpdate(eventId, update, { new: true });
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── GET QUIZ ─────────────────────────────────────────────────────────────────
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

    const questions = event.quiz.questions.map((q, index) => ({
      question: q.question,
      options:  q.options,
      originalQuestionIndex: index,
    }));

    res.status(200).json({ success: true, duration: event.quiz.duration, questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── SUBMIT QUIZ ──────────────────────────────────────────────────────────────
export const submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const { id }      = req.params;
    const userId      = req.user.id;

    if (!answers || answers.length === 0) {
      return res.status(400).json({ success: false, message: "No answers submitted" });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (event.status !== "registration_open") {
      return res.status(400).json({ success: false, message: "Quiz is no longer accepting submissions" });
    }

    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({ success: false, message: "Registration deadline has passed" });
    }

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
      userId,
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


// ─── GENERATE PRIORITY + SLOT ─────────────────────────────────────────────────
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
    const slotData        = await assignTimeSlots(updatedAttempts);

    for (const s of slotData) {
      await QuizAttempt.findByIdAndUpdate(s.id, {
        slotStart: s.slotStart,
        slotEnd:   s.slotEnd,
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


// ─── GET QUIZ ANALYTICS (admin) ───────────────────────────────────────────────
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
    const stats  = {
      total:   attempts.length,
      average: (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2),
      highest: Math.max(...scores),
      lowest:  Math.min(...scores),
    };

    res.status(200).json({ success: true, attempts, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── GET MY STATUS ────────────────────────────────────────────────────────────
export const getMyStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId      = req.user.id;

    const attempt = await QuizAttempt.findOne({ eventId, userId });
    if (!attempt) {
      return res.status(404).json({ success: false, message: "You have not attempted this quiz" });
    }

    const booking = await SeatBooking.findOne({ eventId, userId })
      .populate("seatId", "seatNumber row number");

    // Also check if on waitlist
    const waitlistEntry = await WaitingList.findOne({ eventId, userId });

    res.status(200).json({
      success:  true,
      score:    attempt.score,
      priority: attempt.priority,
      slotStart: attempt.slotStart,
      slotEnd:   attempt.slotEnd,
      booking:       booking       || null,
      waitlistEntry: waitlistEntry || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── CAN BOOK SEAT? ───────────────────────────────────────────────────────────
export const canBookSeat = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId      = req.user.id;

    const event   = await Event.findById(eventId);
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


// ─── GET ALL SEATS ────────────────────────────────────────────────────────────
export const getSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const seats = await Seat.find({ eventId }).populate("bookedBy", "name studentId");

    res.status(200).json({ success: true, seats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── LOCK SEAT ────────────────────────────────────────────────────────────────
export const lockSeat = async (req, res) => {
  try {
    const { eventId, seatId } = req.params;
    const userId = req.user.id;

    const attempt = await QuizAttempt.findOne({ eventId, userId });
    if (!attempt) {
      return res.status(403).json({ success: false, message: "You have not attempted the quiz for this event" });
    }

    const now = new Date();
    if (!attempt.slotStart || !attempt.slotEnd ||
        now < new Date(attempt.slotStart) || now > new Date(attempt.slotEnd)) {
      return res.status(403).json({ success: false, message: "Your booking slot is not active right now" });
    }

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

    seat.status      = "locked";
    seat.bookedBy    = userId;
    seat.lockedUntil = new Date(Date.now() + 2 * 60 * 1000);
    await seat.save();

    res.status(200).json({ success: true, seat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── CONFIRM BOOKING + QR ─────────────────────────────────────────────────────
export const confirmSeatBooking = async (req, res) => {
  try {
    const { eventId, seatId } = req.params;
    const userId = req.user.id;

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
      seat.status      = "available";
      seat.bookedBy    = null;
      seat.lockedUntil = null;
      await seat.save();
      return res.status(400).json({ success: false, message: "Seat lock expired. Please select again." });
    }

    const existingBooking = await SeatBooking.findOne({ eventId, userId });
    if (existingBooking) {
      return res.status(400).json({ success: false, message: "You already have a booking for this event" });
    }

    seat.status      = "booked";
    seat.lockedUntil = null;
    await seat.save();

    const qrToken = crypto.randomBytes(32).toString("hex");

    const booking = await SeatBooking.create({
      userId,
      eventId,
      seatId:     seat._id,
      seatNumber: seat.seatNumber,
      qrToken,
      status:     "confirmed",
    });

    res.status(200).json({
      success: true, message: "Seat booked successfully",
      seat, booking, qrToken,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You already have a booking for this event" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── ASSIGN SCANNERS (admin) ──────────────────────────────────────────────────
export const assignScanners = async (req, res) => {
  try {
    const { eventId }  = req.params;
    const { userIds }  = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, message: "Provide an array of userIds." });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const existingIds = event.scanners.map((s) => s.userId.toString());
    const newEntries  = userIds
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


// ─── REMOVE SCANNER (admin) ───────────────────────────────────────────────────
export const removeScanner = async (req, res) => {
  try {
    const { eventId, userId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    const before    = event.scanners.length;
    event.scanners  = event.scanners.filter((s) => s.userId.toString() !== userId);

    if (event.scanners.length === before) {
      return res.status(404).json({ success: false, message: "Scanner not found for this event." });
    }

    await event.save();
    res.status(200).json({ success: true, message: "Scanner access revoked." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── GET EVENT SCANNERS (admin) ───────────────────────────────────────────────
export const getEventScanners = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId)
      .populate("scanners.userId",  "name studentId email role")
      .populate("scanners.grantedBy", "name")
      .select("scanners title clubName");

    if (!event) return res.status(404).json({ success: false, message: "Event not found." });

    res.status(200).json({ success: true, scanners: event.scanners, eventTitle: event.title });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── GET MY ASSIGNED SCANNER EVENTS ──────────────────────────────────────────
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


// ─── QR SCAN ──────────────────────────────────────────────────────────────────
export const scanQR = async (req, res) => {
  try {
    const { qrToken, eventId } = req.body;

    if (!qrToken)  return res.status(400).json({ success: false, message: "QR token required" });
    if (!eventId)  return res.status(400).json({ success: false, message: "eventId is required" });

    const booking = await SeatBooking.findOne({ qrToken })
      .populate("userId",  "name studentId")
      .populate("eventId", "title date")
      .populate("seatId",  "seatNumber row");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Invalid QR code" });
    }

    if (booking.eventId?._id?.toString() !== eventId.toString()) {
      return res.status(403).json({
        success: false,
        message: "This QR code does not belong to your assigned event.",
      });
    }

    const now = new Date();
    let scanType = "";
    let message  = "";

    if (!booking.entryTime) {
      booking.entryTime = now;
      booking.status    = "present";
      scanType = "entry";
      message  = "Entry confirmed";
    } else if (!booking.exitTime && booking.status === "present") {
      if (booking.breakUsed) {
        return res.status(400).json({ success: false, message: "Break already used" });
      }
      booking.exitTime = now;
      booking.status   = "on_break";
      scanType = "exit";
      message  = "Break started — please return within the allowed time";
    } else if (booking.exitTime && booking.status === "on_break") {
      booking.reEntryTime = now;
      booking.status      = "present";
      booking.breakUsed   = true;
      scanType = "reentry";
      message  = "Re-entry confirmed — welcome back";
    } else {
      return res.status(400).json({ success: false, message: "Invalid scan state" });
    }

    await booking.save();

    res.status(200).json({
      success: true, scanType, message,
      booking: {
        studentName: booking.userId?.name,
        studentId:   booking.userId?.studentId,
        seatNumber:  booking.seatNumber,
        eventTitle:  booking.eventId?.title,
        status:      booking.status,
        entryTime:   booking.entryTime,
        exitTime:    booking.exitTime,
        reEntryTime: booking.reEntryTime,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── GET MY BOOKING ───────────────────────────────────────────────────────────
export const getMyBooking = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId      = req.user.id;

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


// ─── PROCESS EXPIRED SEATS (manual admin trigger) ────────────────────────────
export const processExpiredSeats = async (req, res) => {
  try {
    const { eventId }          = req.params;
    const BREAK_LIMIT_MINUTES  = 15;
    const now    = new Date();
    const cutoff = new Date(now.getTime() - BREAK_LIMIT_MINUTES * 60 * 1000);

    const expiredBreaks = await SeatBooking.find({
      eventId, status: "on_break", exitTime: { $lte: cutoff },
    });

    let freed = 0;
    for (const booking of expiredBreaks) {
      booking.status = "break_expired";
      await booking.save();

      const seat = await Seat.findByIdAndUpdate(
        booking.seatId,
        { status: "available", bookedBy: null },
        { new: true }
      );

      freed++;

      // Auto-assign the freed seat to the next waitlist student
      if (seat) {
        await autoAssignFromWaitlist(eventId, seat);
      }
    }

    res.status(200).json({
      success: true,
      message: `${freed} expired break seat(s) freed`,
      freed,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── EVENT REPORT (admin) ─────────────────────────────────────────────────────
export const getEventReport = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId).populate("auditoriumId", "name rows seatsPerRow");
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    const [seats, bookings, attempts, waitlist] = await Promise.all([
      Seat.find({ eventId }),
      SeatBooking.find({ eventId }).populate("userId", "name studentId email"),
      QuizAttempt.find({ eventId }),
      WaitingList.find({ eventId }).populate("userId", "name studentId").sort({ priority: 1 }),
    ]);

    const seatStats = {
      total:     seats.length,
      available: seats.filter((s) => s.status === "available").length,
      booked:    seats.filter((s) => s.status === "booked").length,
      blocked:   seats.filter((s) => s.status === "blocked").length,
      locked:    seats.filter((s) => s.status === "locked").length,
    };

    const attendanceStats = {
      totalBookings: bookings.length,
      present:       bookings.filter((b) => b.status === "present").length,
      onBreak:       bookings.filter((b) => b.status === "on_break").length,
      breakExpired:  bookings.filter((b) => b.status === "break_expired").length,
      confirmed:     bookings.filter((b) => b.status === "confirmed").length,
    };

    res.status(200).json({
      success: true, event, seatStats, attendanceStats,
      quizParticipants: attempts.length,
      bookings,
      waitlist,
      waitlistCount: waitlist.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 2: WAITING LIST APIs
// ═══════════════════════════════════════════════════════════════════════════════

// ─── JOIN WAITLIST ────────────────────────────────────────────────────────────
export const joinWaitlist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId      = req.user.id;

    // Must have attempted quiz (priority needed)
    const attempt = await QuizAttempt.findOne({ eventId, userId });
    if (!attempt) {
      return res.status(403).json({ success: false, message: "You must attempt the quiz before joining the waitlist" });
    }

    // Cannot join if they already have a booking
    const existingBooking = await SeatBooking.findOne({ eventId, userId });
    if (existingBooking) {
      return res.status(400).json({ success: false, message: "You already have a seat booked for this event" });
    }

    // Cannot join if already on waitlist
    const existingEntry = await WaitingList.findOne({ eventId, userId });
    if (existingEntry) {
      return res.status(400).json({ success: false, message: "You are already on the waitlist for this event" });
    }

    // Check if seats are truly unavailable
    const availableSeats = await Seat.countDocuments({ eventId, status: "available" });
    if (availableSeats > 0) {
      return res.status(400).json({
        success: false,
        message: "Seats are still available — please book a seat directly",
        availableSeats,
      });
    }

    const entry = await WaitingList.create({
      userId,
      eventId,
      priority: attempt.priority || 9999,
      joinedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "You have been added to the waitlist",
      entry,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "You are already on the waitlist" });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── GET WAITLIST (admin) ─────────────────────────────────────────────────────
export const getWaitlist = async (req, res) => {
  try {
    const { eventId } = req.params;

    const waitlist = await WaitingList.find({ eventId })
      .sort({ priority: 1, joinedAt: 1 })
      .populate("userId", "name studentId email");

    res.status(200).json({ success: true, waitlist, count: waitlist.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── LEAVE WAITLIST ───────────────────────────────────────────────────────────
export const leaveWaitlist = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId      = req.user.id;

    const entry = await WaitingList.findOneAndDelete({ eventId, userId });

    if (!entry) {
      return res.status(404).json({ success: false, message: "You are not on the waitlist for this event" });
    }

    res.status(200).json({ success: true, message: "You have been removed from the waitlist" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE 3: OD / ATTENDANCE APIs
// ═══════════════════════════════════════════════════════════════════════════════

// ─── FINALIZE ATTENDANCE (admin) ──────────────────────────────────────────────
export const finalizeAttendance = async (req, res) => {
  try {
    const { eventId }    = req.params;
    const { eventEndTime } = req.body;

    if (!eventEndTime) {
      return res.status(400).json({ success: false, message: "eventEndTime is required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const endTime   = new Date(eventEndTime);
    const startTime = new Date(event.date);

    if (isNaN(endTime.getTime())) {
      return res.status(400).json({ success: false, message: "Invalid eventEndTime format" });
    }

    const totalEventMinutes = Math.max(1, Math.round((endTime - startTime) / 60000));
    const threshold         = totalEventMinutes * 0.5; // 50%

    const bookings = await SeatBooking.find({ eventId });

    let processed = 0;
    let odIssued  = 0;

    for (const booking of bookings) {
      const attended = calculateAttendedMinutes(booking, endTime);
      const issued   = attended >= threshold;

      booking.attendedMinutes = attended;
      booking.odIssued        = issued;
      await booking.save();

      processed++;
      if (issued) odIssued++;
    }

    res.status(200).json({
      success: true,
      message: `Attendance finalized for ${processed} student(s)`,
      totalEventMinutes,
      odThresholdMinutes: Math.round(threshold),
      processed,
      odIssued,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ─── GET MY OD STATUS (student) ───────────────────────────────────────────────
export const getMyOD = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId      = req.user.id;

    const booking = await SeatBooking.findOne({ eventId, userId });

    if (!booking) {
      return res.status(404).json({ success: false, message: "No booking found for this event" });
    }

    const mins    = booking.attendedMinutes || 0;
    const hours   = Math.floor(mins / 60);
    const minutes = mins % 60;

    let durationStr = "";
    if (hours > 0 && minutes > 0) {
      durationStr = `${hours} hour${hours > 1 ? "s" : ""} ${minutes} minute${minutes !== 1 ? "s" : ""}`;
    } else if (hours > 0) {
      durationStr = `${hours} hour${hours > 1 ? "s" : ""}`;
    } else {
      durationStr = `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }

    const statusMessage = booking.odIssued
      ? `You attended ${durationStr} and your OD has been issued.`
      : mins === 0
        ? "You did not attend this event. No OD will be issued."
        : `You attended ${durationStr}. You did not meet the minimum attendance requirement for an OD.`;

    res.status(200).json({
      success:        true,
      attendedMinutes: mins,
      odIssued:        booking.odIssued,
      durationString:  durationStr,
      message:         statusMessage,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
