require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const compression = require("compression");
const rateLimit = require("express-rate-limit");

const logger = require("./utils/logger");
const { testConnection, closeConnection } = require("./config/database");
const { notFound, errorHandler } = require("./middleware/error.middleware");
const setupSwagger = require("./config/swagger");

// Import routes
const authRoutes = require("./routes/auth.routes");
const citizenRoutes = require("./routes/citizen.routes");
const userRoutes = require("./routes/user.routes");
const householdRoutes = require("./routes/household.routes");
const certificateRoutes = require("./routes/certificate.routes");
const temporaryRoutes = require("./routes/temporary.routes");
const wardRoutes = require("./routes/ward.routes");
// Import them cac routes khac o day

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARE SETUP
// =============================================

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// HTTP request logger
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Qua nhieu yeu cau, vui long thu lai sau",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// =============================================
// ROUTES
// =============================================

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/citizens", citizenRoutes);
app.use("/api/users", userRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api", certificateRoutes); // Birth & Death certificates
app.use("/api", temporaryRoutes); // Temporary Residence & Absence
// Mount them cac routes khac o day
// app.use('/api/households', householdRoutes);
// app.use('/api/temporary-residences', tempResidenceRoutes);
// app.use('/api/birth-certificates', birthCertRoutes);
// app.use('/api/death-certificates', deathCertRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/reports', reportRoutes);

// Swagger documentation
setupSwagger(app);

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// =============================================
// START SERVER
// =============================================

const startServer = async () => {
  try {
    // Test database connection
    logger.info("Testing database connection...");
    const isConnected = await testConnection();

    if (!isConnected) {
      logger.error("Database connection test failed");
      process.exit(1);
    }

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
      logger.info(`API Documentation: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

// =============================================
// GRACEFUL SHUTDOWN
// =============================================

const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    // Close database connection
    await closeConnection();
    logger.info("Database connection closed");

    // Exit process
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle process termination
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  gracefulShutdown("uncaughtException");
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  gracefulShutdown("unhandledRejection");
});

// Start the server
startServer();

module.exports = app;
