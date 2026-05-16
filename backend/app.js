require("dotenv").config();

const express = require("express");

const env = require("./config/env");
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

  app.use(corsHeadersMiddleware(env));
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
    if (res.headersSent) {
      return next(error);
    }

    applyCorsHeaders(req, res, env);

    console.error("Unhandled Error:", error.message);

    return res.status(500).json({
      error: "Internal server error",
      message: error.message || "Internal server error"
    });
  });

  return app;
};

module.exports = {
  buildApp
};
