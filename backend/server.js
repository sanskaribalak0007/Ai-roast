require("dotenv").config();

const connectDB = require("./config/db");
const env = require("./config/env");
const { createSessionMiddleware } = require("./config/session");
const { buildApp } = require("./app");

const requiredEnvKeys = [
  "mongoUri",
  "sessionSecret",
  "resetSecret",
  "geminiApiKey"
];

const missingEnvKeys = requiredEnvKeys.filter((key) => !env[key]);

if (missingEnvKeys.length > 0) {
  console.error(`Missing required environment values: ${missingEnvKeys.join(", ")}`);
  process.exit(1);
}

const startServer = async () => {
  await connectDB();

  const sessionMiddleware = createSessionMiddleware();
  const app = buildApp(sessionMiddleware);

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    console.log(`[CORS] Allowed origins: ${env.corsOrigins.join(", ") || "(Netlify preview rule in production)"}`);
    console.log(`[CORS] Netlify previews: ${env.allowNetlifyPreviews ? "enabled" : "disabled"}`);
    console.log(`[cookies] secure=${env.cookieSecure} sameSite=${env.cookieSameSite}`);
    console.log("[session] MongoDB store ready");
  });
};

startServer().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});
