const mongoose = require("mongoose");
const env = require("./env");

const connectDB = async () => {
  try {
    if (!env.mongoUri) {
      throw new Error("MONGO_URI is required");
    }

    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
      family: 4
    });

    console.log("MongoDB Connected");

  } catch (error) {

    console.log("MongoDB connection failed:", error.message);
    console.log("Check Atlas network access, cluster status, and connection string.");
    process.exit(1);

  }
};

module.exports = connectDB;
