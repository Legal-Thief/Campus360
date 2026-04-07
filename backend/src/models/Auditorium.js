import mongoose from "mongoose";

const auditoriumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    rows: {
      type: [String],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length > 0;
        },
        message: "At least one row is required",
      },
    },

    seatsPerRow: {
      type: Number,
      required: true,
      min: 1,
    },

    blockedSeats: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export default mongoose.model(
  "Auditorium",
  auditoriumSchema
);