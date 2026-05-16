const connectDB = require("../config/db");
const { createSessionMiddleware } = require("../config/session");
const { buildApp } = require("../app");

let appInstance;

const getApp = async () => {
  if (!appInstance) {
    await connectDB();
    appInstance = buildApp(createSessionMiddleware());
  }

  return appInstance;
};

module.exports = async (req, res) => {
  const app = await getApp();
  return app(req, res);
};
