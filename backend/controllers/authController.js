const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { persistUserSession } = require("../utils/sessionHelpers");
const env = require("../config/env");
const { buildAccessState, ensureWeeklyCredits } = require("../services/usageService");

const OTP_TTL_MS = 1000 * 60 * 10;

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const createOtpCode = () => String(crypto.randomInt(100000, 1000000));
const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");
const buildOtpExpiry = () => new Date(Date.now() + OTP_TTL_MS);
const hasOtpExpired = (expiresAt) => !expiresAt || new Date(expiresAt).getTime() <= Date.now();
const isVerifiedUser = (user) => user?.isEmailVerified !== false;

const sendRegistrationOtpEmail = (email, otp, name) =>
  sendEmail(
    email,
    "Your registration OTP",
    [`Hi ${name || "there"},`, "", `Your registration OTP is: ${otp}`, "It will expire in 10 minutes."].join("\n")
  );

const sendResetEmail = (email, resetLink, name) =>
  sendEmail(
    email,
    "Reset your Roast & Boast AI password",
    [
      `Hi ${name || "there"},`,
      "",
      "Use the secure link below to reset your Roast & Boast AI password:",
      resetLink,
      "",
      "This link expires in 15 minutes."
    ].join("\n")
  );

const withEmailDeliveryMessage = (error, fallbackMessage) => {
  const message = error?.message || "";

  if (
    message.includes("Email configuration is missing") ||
    message.includes("Missing credentials") ||
    message.includes("Invalid login") ||
    message.includes("Username and Password not accepted") ||
    message.includes("EAUTH") ||
    message.includes("ETIMEDOUT")
  ) {
    return `${fallbackMessage} Check Render email settings (EMAIL_USER, EMAIL_PASS/app password, EMAIL_FROM).`;
  }

  return fallbackMessage;
};

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
    const otp = String(req.body?.otp || "").trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });

    if (!otp) {
      if (existingUser && isVerifiedUser(existingUser)) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const generatedOtp = createOtpCode();
      const otpHash = hashOtp(generatedOtp);
      const otpExpiresAt = buildOtpExpiry();

      const user = existingUser || new User({ email });
      user.name = name;
      user.email = email;
      user.password = hashedPassword;
      user.isEmailVerified = false;
      user.registerOtpHash = otpHash;
      user.registerOtpExpiresAt = otpExpiresAt;
      await user.save();

      try {
        await sendRegistrationOtpEmail(email, generatedOtp, name);
      } catch (emailError) {
        return res.status(500).json({
          message: withEmailDeliveryMessage(emailError, "Unable to send registration OTP email.")
        });
      }

      return res.json({
        otpRequired: true,
        stage: "register",
        message: "Registration OTP sent to your email"
      });
    }

    if (!existingUser) {
      return res.status(400).json({ message: "Please request a registration OTP first" });
    }

    if (isVerifiedUser(existingUser)) {
      return res.status(400).json({ message: "User already exists" });
    }

    if (hasOtpExpired(existingUser.registerOtpExpiresAt)) {
      return res.status(400).json({ message: "Registration OTP expired. Request a new OTP." });
    }

    if (existingUser.registerOtpHash !== hashOtp(otp)) {
      return res.status(400).json({ message: "Invalid registration OTP" });
    }

    existingUser.isEmailVerified = true;
    existingUser.registerOtpHash = "";
    existingUser.registerOtpExpiresAt = null;
    await existingUser.save();

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
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!isVerifiedUser(user)) {
      return res.status(400).json({ message: "Verify your email first before resetting the password" });
    }

    const resetToken = jwt.sign({ id: user._id }, env.resetSecret, { expiresIn: "15m" });

    user.resetToken = resetToken;
    await user.save();

    const resetLink = `${env.frontendUrl.replace(/\/$/, "")}/reset/${resetToken}`;
    try {
      await sendResetEmail(email, resetLink, user.name);
    } catch (emailError) {
      return res.status(500).json({
        message: withEmailDeliveryMessage(emailError, "Unable to send reset link email.")
      });
    }

    return res.json({ message: "Reset link sent to email" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to send reset link" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const password = req.body?.password;

    if (!token || !password) {
      return res.status(400).json({ message: "Token and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const decoded = jwt.verify(token, env.resetSecret);
    const user = await User.findById(decoded.id);

    if (!user || user.resetToken !== token) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = "";
    user.loginOtpHash = "";
    user.loginOtpExpiresAt = null;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Password reset failed" });
  }
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
