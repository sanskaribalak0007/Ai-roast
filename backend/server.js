require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");
const env = require("./config/env");

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

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
    console.log(`[CORS] Allowed origins: ${env.corsOrigins.join(", ") || "(none — using Netlify preview rule in production)"}`);
    console.log(`[CORS] Netlify previews: ${env.allowNetlifyPreviews ? "enabled" : "disabled"}`);
    console.log(`[cookies] secure=${env.cookieSecure} sameSite=${env.cookieSameSite}`);
  });
};

startServer();
