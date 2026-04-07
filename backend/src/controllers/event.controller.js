import Event from "../models/Event.js";
import QuizAttempt from "../models/QuizAttempt.js";
import Seat from "../models/Seat.js";
import Auditorium from "../models/Auditorium.js";
import { calculatePriority } from "../services/priority.service.js";
import { assignTimeSlots } from "../services/slot.service.js";

// =======================
// CREATE EVENT
// =======================
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      auditoriumId,
      date,
      registrationDeadline,
      bookingStart,
      bookingEnd,
      quiz,
    } = req.body;

    if (
      !title ||
      !auditoriumId ||
      !date ||
      !registrationDeadline ||
      !quiz ||
      !quiz.duration ||
      !quiz.questions ||
      quiz.questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    const auditorium = await Auditorium.findById(
      auditoriumId
    );

    if (!auditorium) {
      return res.status(404).json({
        success: false,
        message: "Auditorium not found",
      });
    }

    const event = await Event.create({
      title,
      description,
      venue: auditorium.name,
      auditoriumId,
      date,
      registrationDeadline,
      bookingStart,
      bookingEnd,
      quiz,
    });

    const seats = [];

    auditorium.rows.forEach((row) => {
      for (
        let i = 1;
        i <= auditorium.seatsPerRow;
        i++
      ) {
        const seatNumber = `${row}${i}`;

        seats.push({
          eventId: event._id,
          row,
          number: i,
          seatNumber,
          status: auditorium.blockedSeats.includes(
            seatNumber
          )
            ? "blocked"
            : "available",
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
    console.log("CREATE EVENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GET OPEN EVENTS
// =======================
export const getOpenEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: "registration_open",
    })
      .populate("auditoriumId", "name")
      .select("-quiz.questions.correctAnswerIndex");

    res.status(200).json({
      success: true,
      events,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GET QUIZ
// =======================
export const getQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const questions = event.quiz.questions.map(
      (q, index) => ({
        question: q.question,
        options: q.options,
        originalQuestionIndex: index,
      })
    );

    res.status(200).json({
      success: true,
      duration: event.quiz.duration,
      questions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// SUBMIT QUIZ
// =======================
export const submitQuiz = async (req, res) => {
  try {
    const { userId, answers } = req.body;
    const { id } = req.params;

    if (!answers || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No answers submitted",
      });
    }

    const event = await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    let score = 0;

    answers.forEach((ans) => {
      const question =
        event.quiz.questions[
        ans.originalQuestionIndex
        ];

      if (
        question &&
        question.correctAnswerIndex ===
        ans.originalOptionIndex
      ) {
        score++;
      }
    });

    const attempt = await QuizAttempt.create({
      userId,
      eventId: id,
      answers,
      score,
    });

    res.status(200).json({
      success: true,
      score,
      attempt,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GENERATE PRIORITY + SLOT
// =======================
export const generatePriority = async (req, res) => {
  try {
    const { eventId } = req.params;

    const attempts = await QuizAttempt.find({
      eventId,
    });

    if (!attempts.length) {
      return res.status(404).json({
        success: false,
        message: "No quiz attempts found",
      });
    }

    const priorityList =
      calculatePriority(attempts);

    for (const p of priorityList) {
      await QuizAttempt.findOneAndUpdate(
        { userId: p.userId, eventId },
        { priority: p.priority }
      );
    }

    const updatedAttempts =
      await QuizAttempt.find({ eventId }).sort({
        priority: 1,
      });

    const slotData = await assignTimeSlots(
      updatedAttempts
    );

    for (const s of slotData) {
      await QuizAttempt.findByIdAndUpdate(s.id, {
        slotStart: s.slotStart,
        slotEnd: s.slotEnd,
      });
    }

    res.status(200).json({
      success: true,
      message:
        "Priority and slots generated successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GET RESULT / STATUS
// =======================
export const getMyStatus = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const attempt = await QuizAttempt.findOne({
      eventId,
      userId,
    });

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Attempt not found",
      });
    }

    res.status(200).json({
      success: true,
      score: attempt.score,
      priority: attempt.priority,
      slotStart: attempt.slotStart,
      slotEnd: attempt.slotEnd,
    });
  } catch (error) {
    console.log("MY STATUS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GET ALL SEATS
// =======================
export const getSeats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const seats = await Seat.find({
      eventId,
    });

    res.status(200).json({
      success: true,
      seats,
    });
  } catch (error) {
    console.log("GET SEATS ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =======================
// CAN BOOK SEAT?
// =======================
export const canBookSeat = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id || req.body.userId;

    const event = await Event.findById(eventId);
    const attempt = await QuizAttempt.findOne({ eventId, userId });
    if (!event || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Event or attempt not found",
      });
    }

    const now = new Date();
    const allowed =
      now >= new Date(event.bookingStart) &&
      now <= new Date(event.bookingEnd) &&
      now >= new Date(attempt.slotStart) &&
      now <= new Date(attempt.slotEnd);

    res.status(200).json({
      success: true,
      allowed,
      bookingStart: event.bookingStart,
      bookingEnd: event.bookingEnd,
      slotStart: attempt.slotStart,
      slotEnd: attempt.slotEnd,
    });
  } catch (error) {
    console.error("CAN BOOK ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =======================
// LOCK SEAT
// =======================
export const lockSeat = async (req, res) => {
  try {
    const { eventId, seatId } = req.params;
    const userId =
      req.user?.id || req.body.userId;

    const seat = await Seat.findOne({
      _id: seatId,
      eventId,
    });

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    if (
      seat.status === "booked" ||
      seat.status === "blocked"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "This seat cannot be selected",
      });
    }

    if (
      seat.status === "locked" &&
      seat.bookedBy?.toString() !== userId
    ) {
      if (
        seat.lockedUntil &&
        new Date(seat.lockedUntil) > new Date()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Seat temporarily locked by another user",
        });
      }
    }

    seat.status = "locked";
    seat.bookedBy = userId;
    seat.lockedUntil = new Date(
      Date.now() + 2 * 60 * 1000
    );

    await seat.save();

    res.status(200).json({
      success: true,
      seat,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// CONFIRM BOOKING
// =======================
export const confirmSeatBooking = async (
  req,
  res
) => {
  try {
    const { eventId, seatId } = req.params;
    const userId =
      req.user?.id || req.body.userId;

    const seat = await Seat.findOne({
      _id: seatId,
      eventId,
    });

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found",
      });
    }

    if (seat.status !== "locked") {
      return res.status(400).json({
        success: false,
        message: "Seat is not locked",
      });
    }

    if (seat.bookedBy?.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message:
          "You do not own this seat lock",
      });
    }

    if (
      !seat.lockedUntil ||
      new Date(seat.lockedUntil) < new Date()
    ) {
      seat.status = "available";
      seat.bookedBy = null;
      seat.lockedUntil = null;

      await seat.save();

      return res.status(400).json({
        success: false,
        message: "Seat lock expired",
      });
    }

    seat.status = "booked";
    seat.lockedUntil = null;

    await seat.save();

    res.status(200).json({
      success: true,
      message: "Seat booked successfully",
      seat,
    });
  } catch (error) {
    console.log(
      "CONFIRM BOOKING ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};