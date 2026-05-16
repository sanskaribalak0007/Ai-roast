const session = require("express-session");
const connectMongo = require("connect-mongo");
const mongoose = require("mongoose");
const env = require("./env");

const MongoStore = connectMongo.default || connectMongo.MongoStore || connectMongo;

/**
 * Session store using the active Mongoose connection (stable on Render).
 */
const createSessionMiddleware = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error("MongoDB must be connected before creating session middleware");
  }

  return session({
    name: env.sessionName,
    secret: env.sessionSecret,
    resave: false,
    saveUninitialized: false,
    proxy: env.trustProxy,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: "sessions",
      ttl: Math.floor(env.sessionMaxAge / 1000),
      touchAfter: 24 * 3600
    }),
    cookie: {
      httpOnly: true,
      secure: env.isProduction ? true : env.cookieSecure,
      sameSite: env.isProduction ? "none" : env.cookieSameSite,
      maxAge: env.sessionMaxAge
    }
  });
};

module.exports = {
  createSessionMiddleware
};
