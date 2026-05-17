/**
 * Normalizes a URL to its origin (scheme + host + port), no trailing slash.
 */
const normalizeOrigin = (value = "") => {
  const trimmed = String(value).trim();

  if (!trimmed) {
    return "";
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/$/, "");
  }
};

const parseOrigins = (value = "") =>
  value
    .split(",")
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);

const formatEmailFrom = (rawFrom, fallbackUser) => {
  const trimmed = String(rawFrom || "").trim();

  if (trimmed) {
    return trimmed;
  }

  if (!fallbackUser) {
    return "";
  }

  return `Roast & Boast AI <${fallbackUser}>`;
};

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const parseSameSite = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (!normalized) {
    return isProduction ? "none" : "lax";
  }

  if (normalized === "false" || normalized === "none") {
    return "none";
  }

  if (normalized === "strict") {
    return "strict";
  }

  return "lax";
};

const corsOrigins = [
  ...new Set([
    ...parseOrigins(process.env.CORS_ORIGINS),
    ...parseOrigins(process.env.CLIENT_URLS),
    normalizeOrigin(process.env.FRONTEND_URL)
  ].filter(Boolean))
];

// In production, allow Netlify deploys unless explicitly disabled.
const allowNetlifyPreviews =
  process.env.ALLOW_NETLIFY_PREVIEWS === "true" ||
  (isProduction && process.env.ALLOW_NETLIFY_PREVIEWS !== "false");

module.exports = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  sessionSecret: process.env.SESSION_SECRET,
  resetSecret: process.env.RESET_SECRET,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  frontendUrl: normalizeOrigin(process.env.FRONTEND_URL) || corsOrigins[0] || "",
  corsOrigins,
  allowNetlifyPreviews,
  trustProxy: process.env.TRUST_PROXY === "true" || isProduction,
  sessionName: process.env.SESSION_NAME || "ai_roast.sid",
  sessionMaxAge: Number(process.env.SESSION_MAX_AGE_MS) || 1000 * 60 * 60 * 24,
  cookieSecure: process.env.COOKIE_SECURE === "true" || isProduction,
  cookieSameSite: parseSameSite(process.env.COOKIE_SAME_SITE),
  emailService: process.env.EMAIL_SERVICE || "gmail",
  emailHost: process.env.EMAIL_HOST,
  emailPort: Number(process.env.EMAIL_PORT) || 587,
  emailSecure: process.env.EMAIL_SECURE === "true",
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  emailFrom: formatEmailFrom(process.env.EMAIL_FROM, process.env.EMAIL_USER),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || "ai-roast",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  normalizeOrigin
};
