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
app.use(
  cors({
    origin: process.env.ORIGIN || "http://localhost:5173",
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
app.use("/api", indexRoutes);
app.use("/api/plans", planRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
