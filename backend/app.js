require("dotenv").config();

const express = require("express");
const cors = require("cors");
const session = require("express-session");
const connectMongo = require("connect-mongo");

const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const publicRoutes = require("./routes/publicRoutes");
const toolRoutes = require("./routes/toolRoutes");
const billingRoutes = require("./routes/billingRoutes");

const app = express();
const MongoStore = connectMongo.default || connectMongo.MongoStore || connectMongo;

if (env.trustProxy) {
  app.set("trust proxy", 1);
}

const corsOptions = {
  origin(origin, callback) {
    if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS origin not allowed"));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: "2mb" }));

app.use(
  session({
    name: env.sessionName,
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: env.trustProxy,
    store: MongoStore.create({
      mongoUrl: env.mongoUri
    }),
    cookie: {
      httpOnly: true,
      secure: env.cookieSecure,
      sameSite: env.cookieSameSite,
      maxAge: env.sessionMaxAge
    }
  })
);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "AI Roast backend running"
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    environment: env.nodeEnv
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
  if (error.message === "CORS origin not allowed") {
    return res.status(403).json({
      error: "CORS origin not allowed"
    });
  }

  console.error("Unhandled Error:", error.message);

  return res.status(500).json({
    error: "Internal server error"
  });
});

module.exports = app;
