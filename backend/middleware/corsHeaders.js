const { isOriginAllowed } = require("../utils/cors");
const { normalizeOrigin } = require("../config/env");

/**
 * Ensures credentialed cross-origin responses include CORS headers (including errors).
 */
const applyCorsHeaders = (req, res, env) => {
  const origin = req.headers.origin;

  if (!origin || !isOriginAllowed(origin, env)) {
    return;
  }

  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Vary", "Origin");
};

const corsHeadersMiddleware = (env) => (req, res, next) => {
  const origin = req.headers.origin;
  const hasOrigin = Boolean(origin);
  const allowed = !hasOrigin || isOriginAllowed(origin, env);

  if (allowed) {
    applyCorsHeaders(req, res, env);
  }

  if (req.method === "OPTIONS") {
    if (!allowed) {
      return res.status(403).json({
        error: "CORS origin not allowed",
        message: `Add ${origin || "your frontend URL"} to CORS_ORIGINS on Render.`
      });
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }

  if (!allowed) {
    console.warn(
      "[CORS] Blocked origin:",
      origin || "(none)",
      "| Allowed:",
      env.corsOrigins.join(", ") || "(none — set CORS_ORIGINS on Render)"
    );
    return res.status(403).json({
      error: "CORS origin not allowed",
      message: `Add ${origin || "your frontend URL"} to CORS_ORIGINS on Render.`
    });
  }

  next();
};

module.exports = {
  applyCorsHeaders,
  corsHeadersMiddleware,
  normalizeOrigin
};
