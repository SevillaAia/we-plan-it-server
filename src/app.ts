import "dotenv/config";
import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// Import routes
import indexRoutes from "./routes/index.routes";
import planRoutes from "./routes/plan.routes";

// Import error handling
import { errorHandler, notFoundHandler } from "./middleware/error-handling";

const app: Application = express();

// Middleware
const allowedOrigins = (process.env.ORIGIN || "http://localhost:5173").split(',');
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(morgan("dev"));

// Root route
app.get("/", (req, res) => {
  res.json({ message: "We Plan It API is running! Use /api for endpoints." });
});

// Routes
app.use("/api", planRoutes);
app.use("/api/plans", planRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
