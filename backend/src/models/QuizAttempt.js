import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
    answers: [
      {
        originalQuestionIndex: Number,
        originalOptionIndex: Number,
      },
    ],
    score: { type: Number, default: 0 },
    priority: { type: Number },
    slotStart: { type: Date },
    slotEnd: { type: Date },
    submittedAt: { type: Date },
  },
  { timestamps: true }
);

// FIX: unique index prevents duplicate quiz submissions at DB level
quizAttemptSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export default mongoose.model("QuizAttempt", quizAttemptSchema);
