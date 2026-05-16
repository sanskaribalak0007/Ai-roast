const bcrypt = require("bcryptjs");

const User = require("../models/User");
const { persistUserSession } = require("../utils/sessionHelpers");
const { buildAccessState, ensureWeeklyCredits } = require("../services/usageService");

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const isVerifiedUser = (user) => user?.isEmailVerified !== false;

const serializeUser = (user) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
  access: buildAccessState(user)
});

exports.register = async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });

    if (isVerifiedUser(existingUser)) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashedPassword;
      existingUser.isEmailVerified = true;
      existingUser.registerOtpHash = "";
      existingUser.registerOtpExpiresAt = null;
      await existingUser.save();
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        isEmailVerified: true
      });
    }

    return res.json({ message: "Registration completed successfully. Please login with your email and password." });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Registration failed" });
  }
};

exports.login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!isVerifiedUser(user)) {
      return res.status(400).json({ message: "Please verify your email first through registration OTP" });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ message: "Invalid password" });
    }

    user.loginOtpHash = "";
    user.loginOtpExpiresAt = null;
    await user.save();

    await persistUserSession(req, user);
    await ensureWeeklyCredits(user);

    return res.json({
      message: "Login successful",
      user: serializeUser(user)
    });
  } catch (error) {
    console.error("[login] failed:", error.message);
    return res.status(500).json({
      message: error.message || "Login failed. Please try again."
    });
  }
};

exports.forgotPassword = async (req, res) => {
  return res.status(410).json({
    message: "Password reset by email is currently unavailable. Contact support or create a new account."
  });
};

exports.resetPassword = async (req, res) => {
  return res.status(410).json({
    message: "Password reset by email is currently unavailable. Contact support or create a new account."
  });
};

exports.logout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ message: "Logout failed" });
    }

    res.clearCookie(env.sessionName || "ai_roast.sid");
    return res.json({ message: "Logout successful" });
  });
};

exports.checkAuth = (req, res) => {
  if (!req.session.user) {
    return res.json({ loggedIn: false });
  }

  User.findById(req.session.user.id)
    .then(async (user) => {
      if (!user) {
        return res.json({ loggedIn: false });
      }

      await ensureWeeklyCredits(user);

      return res.json({
        loggedIn: true,
        user: serializeUser(user)
      });
    })
    .catch(() => {
      res.json({
        loggedIn: true,
        user: req.session.user
      });
    });
};
