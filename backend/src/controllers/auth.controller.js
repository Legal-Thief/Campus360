import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";


// REGISTER
export const register = async (req, res) => {
  try {
    const {
      name,
      studentId,
      email,
      password,
      residentType,
      hostelBlock,
      roomNumber,
    } = req.body;

    if (!name || !studentId || !email || !password || !residentType) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Validate studentId is exactly 10 digits
    if (!/^\d{10}$/.test(studentId)) {
      return res.status(400).json({ success: false, message: "Student ID must be exactly 10 digits" });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    if (!["day_scholar", "hosteller"].includes(residentType)) {
      return res.status(400).json({ success: false, message: "residentType must be day_scholar or hosteller" });
    }

    if (residentType === "hosteller" && (!hostelBlock || !roomNumber)) {
      return res.status(400).json({ success: false, message: "Hostellers must provide hostel block and room number" });
    }

    // Check both email AND studentId uniqueness in one query each
    const [existingEmail, existingStudentId] = await Promise.all([
      User.findOne({ email: email.toLowerCase() }),
      User.findOne({ studentId }),
    ]);

    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    if (existingStudentId) {
      return res.status(400).json({ success: false, message: "Student ID already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 12); // increased from 10 to 12

    const user = await User.create({
      name: name.trim(),
      studentId,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: "student",
      residentType,
      hostelBlock: residentType === "hosteller" ? hostelBlock.trim() : null,
      roomNumber: residentType === "hosteller" ? roomNumber.trim() : null,
    });

    // Don't return token on register — force them to login
    res.status(201).json({
      success: true,
      message: "Account created successfully. Please log in.",
    });
  } catch (error) {
    // Handle MongoDB duplicate key error (race condition safety)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `${field === "email" ? "Email" : "Student ID"} already registered`,
      });
    }
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};


// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    // Select password explicitly since it's excluded by default
    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    // Use same error message for both "user not found" and "wrong password"
    // to prevent user enumeration attacks
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        residentType: user.residentType,
        hostelBlock: user.hostelBlock,
        roomNumber: user.roomNumber,
        studentId: user.studentId,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error. Please try again." });
  }
};
