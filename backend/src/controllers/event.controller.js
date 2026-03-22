import Event from "../models/Event.js";
import QuizAttempt from "../models/QuizAttempt.js";
import { calculatePriority } from "../services/priority.service.js";

// =======================
// CREATE EVENT
// =======================
export const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      venue,
      date,
      registrationDeadline,
      quiz,
    } = req.body;

    if (
      !title ||
      !venue ||
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

    const event = await Event.create({
      title,
      description,
      venue,
      date,
      registrationDeadline,
      quiz,
    });

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================
// GET OPEN EVENTS (Student)
// =======================
export const getOpenEvents = async (req, res) => {
  try {
    const events = await Event.find({
      status: "registration_open",
    }).select("-quiz.questions.correctAnswerIndex");

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
// GENERATE PRIORITY
// =======================
export const generatePriority = async (req, res) => {
  try {
    const { eventId } = req.params;

    const attempts = await QuizAttempt.find({ eventId });

    if (!attempts.length) {
      return res.status(404).json({
        success: false,
        message: "No quiz attempts found",
      });
    }

    const priorityList = calculatePriority(attempts);

    res.status(200).json({
      success: true,
      priorityList,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =======================
// SUBMIT QUIZ (FIXED)
// =======================
export const submitQuiz = async (req, res) => {
  try {
    const { userId, answers } = req.body;
    const { id } = req.params;

    // validation
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
        event.quiz.questions[ans.originalQuestionIndex];

      if (
        question &&
        question.correctAnswerIndex === ans.originalOptionIndex
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


// getQuiz
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

    // send quiz WITHOUT correct answers
    const questions = event.quiz.questions.map((q, index) => ({
      question: q.question,
      options: q.options,
      originalQuestionIndex: index, // important
    }));

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