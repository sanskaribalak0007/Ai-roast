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
  applyCorsHeaders(req, res, env);

  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }

  next();
};

module.exports = {
  applyCorsHeaders,
  corsHeadersMiddleware,
  normalizeOrigin
};
