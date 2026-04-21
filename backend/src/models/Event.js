import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length === 4,
        message: "Each question must have exactly 4 options",
      },
    },
    correctAnswerIndex: { type: Number, required: true, min: 0, max: 3 },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    venue: { type: String, required: true, trim: true },
    auditoriumId: { type: mongoose.Schema.Types.ObjectId, ref: "Auditorium", required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // FIX: track creator
    date: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    bookingStart: { type: Date, default: null },
    bookingEnd: { type: Date, default: null },
    status: {
      type: String,
      enum: ["registration_open", "quiz_closed", "priority_calculated", "seat_selection", "completed"],
      default: "registration_open",
    },
    quiz: {
      duration: { type: Number, required: true, min: 1 },
      questions: {
        type: [questionSchema],
        required: true,
        validate: {
          validator: (arr) => arr.length > 0,
          message: "At least one question is required",
        },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
