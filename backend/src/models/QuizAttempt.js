import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
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
    answers: [
      {
        questionIndex: Number,
        selectedOptionIndex: Number,
      },
    ],
    score: {
      type: Number,
      default: 0,
    },

    // 🔥 ADD THESE BELOW
    priority: {
      type: Number,
    },

    slotStart: {
      type: Date,
    },

    slotEnd: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("QuizAttempt", quizAttemptSchema);