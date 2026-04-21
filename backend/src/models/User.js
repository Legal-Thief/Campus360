import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    studentId: { type: String, unique: true, sparse: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false }, // hidden by default
    role: {
      type: String,
      enum: ["student", "faculty", "warden", "admin", "superadmin"],
      default: "student",
    },
    residentType: {
      type: String,
      enum: ["day_scholar", "hosteller"],
      default: "day_scholar",
    },
    hostelBlock: { type: String, default: null },
    roomNumber: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
