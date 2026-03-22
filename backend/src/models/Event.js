import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length === 4;
        },
        message: "Each question must have exactly 4 options",
      },
    },
    correctAnswerIndex: {
      type: Number,
      required: true,
      min: 0,
      max: 3,
    },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    venue: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    registrationDeadline: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "registration_open",
        "quiz_closed",
        "priority_calculated",
        "seat_selection",
        "completed",
      ],
      default: "registration_open",
    },
    quiz: {
      duration: {
        type: Number,
        required: true,
      },
      questions: {
        type: [questionSchema],
        required: true,
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);