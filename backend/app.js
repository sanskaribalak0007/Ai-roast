require("dotenv").config();

const express = require("express");
const cors = require("cors");

const env = require("./config/env");
const { isOriginAllowed } = require("./utils/cors");
const { applyCorsHeaders, corsHeadersMiddleware } = require("./middleware/corsHeaders");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const publicRoutes = require("./routes/publicRoutes");
const toolRoutes = require("./routes/toolRoutes");
const billingRoutes = require("./routes/billingRoutes");

const buildApp = (sessionMiddleware) => {
  const app = express();

  if (env.trustProxy) {
    app.set("trust proxy", 1);
  }

  const corsOptions = {
    origin(origin, callback) {
      if (isOriginAllowed(origin, env)) {
        return callback(null, true);
      }

      console.warn(
        "[CORS] Blocked origin:",
        origin || "(none)",
        "| Allowed:",
        env.corsOrigins.join(", ") || "(none — set CORS_ORIGINS on Render)"
      );
      return callback(new Error("CORS origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204
  };

  app.use(corsHeadersMiddleware(env));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "2mb" }));

  if (sessionMiddleware) {
    app.use(sessionMiddleware);
  }

  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "AI Roast backend running"
    });
  });

  app.get("/health", (req, res) => {
    res.json({
      success: true,
      environment: env.nodeEnv,
      sessionStore: sessionMiddleware ? "mongo" : "pending"
    });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api", publicRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api/tools", toolRoutes);
  app.use("/api/billing", billingRoutes);

  app.use((req, res) => {
    res.status(404).json({
      error: "Route not found"
    });
  });

  app.use((error, req, res, next) => {
    applyCorsHeaders(req, res, env);

    if (error.message === "CORS origin not allowed") {
      return res.status(403).json({
        error: "CORS origin not allowed",
        message: `Add ${req.headers.origin || "your frontend URL"} to CORS_ORIGINS on Render.`
      });
    }

    console.error("Unhandled Error:", error.message);

    return res.status(500).json({
      error: "Internal server error",
      message: "Internal server error"
    });
  });

  return app;
};

module.exports = {
  buildApp
};
