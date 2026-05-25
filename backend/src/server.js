import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Cron jobs
import { startBreakExpiryCron } from "./cron/breakExpiry.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import auditoriumRoutes from "./routes/auditorium.routes.js";
import hostelRoutes from "./routes/hostel.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import lostFoundRoutes from "./routes/lostFound.routes.js";

dotenv.config();
connectDB();

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

// Security headers 
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

//  CORS 
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

//  Static file serving: campus navigation images 
app.use(
  "/images",
  express.static(path.join(__dirname, "uploads", "campusImages"))
);

//  Body parser 
app.use(express.json({ limit: "10kb" }));

//  NoSQL injection sanitization 
app.use((req, res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === "object") {
      for (const key of Object.keys(obj)) {
        if (key.startsWith("$") || key.includes(".")) {
          delete obj[key];
        } else {
          sanitize(obj[key]);
        }
      }
    }
  };
  sanitize(req.body);
  sanitize(req.params);
  next();
});

//  Global rate limiter 
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // suppress proxy validation warning
});
app.use(globalLimiter);

//  Auth rate limiter 
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many auth attempts, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // suppress proxy validation warning
});

//  Routes 
app.use("/api/auth",        authLimiter, authRoutes);
app.use("/api/events",      eventRoutes);
app.use("/api/auditoriums", auditoriumRoutes);
app.use("/api/hostel",      hostelRoutes);
app.use("/api/admin",       adminRoutes);
app.use("/api",             chatRoutes);
app.use("/api/lost-found",  lostFoundRoutes);

//  Health check 
app.get("/", (req, res) => {
  res.send("Campus360 Backend Running ✓");
});

//  Global error handler 
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

//  Start server 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Campus360 server running on port ${PORT}`);
  // Start background cron jobs
  startBreakExpiryCron();
});