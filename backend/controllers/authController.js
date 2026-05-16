const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { persistUserSession } = require("../utils/sessionHelpers");
const env = require("../config/env");
const { buildAccessState, ensureWeeklyCredits } = require("../services/usageService");

const OTP_TTL_MS = 1000 * 60 * 10;
const APP_NAME = "Roast & Boast AI";

const normalizeEmail = (email = "") => email.trim().toLowerCase();
const createOtpCode = () => String(crypto.randomInt(100000, 1000000));
const hashOtp = (otp) => crypto.createHash("sha256").update(String(otp)).digest("hex");
const buildOtpExpiry = () => new Date(Date.now() + OTP_TTL_MS);
const hasOtpExpired = (expiresAt) => !expiresAt || new Date(expiresAt).getTime() <= Date.now();
const isVerifiedUser = (user) => user?.isEmailVerified !== false;

const buildEmailShell = ({ eyebrow, title, bodyHtml, actionLabel = "", actionUrl = "", footerNote = "" }) => ({
  text: [title, "", footerNote].filter(Boolean).join("\n"),
  html: `
    <div style="margin:0;padding:32px 16px;background:#f5f7fb;font-family:Arial,sans-serif;color:#16213e;">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e6ebf2;border-radius:24px;overflow:hidden;box-shadow:0 18px 40px rgba(22,33,62,0.08);">
        <div style="padding:24px 28px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;">
          <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">${eyebrow}</div>
          <h1 style="margin:12px 0 0;font-size:30px;line-height:1.05;">${title}</h1>
        </div>
        <div style="padding:28px;line-height:1.7;font-size:16px;color:#42526b;">
          ${bodyHtml}
          ${actionUrl ? `<div style="margin-top:28px;"><a href="${actionUrl}" style="display:inline-block;padding:14px 22px;border-radius:14px;background:#4f46e5;color:#ffffff;text-decoration:none;font-weight:700;">${actionLabel}</a></div>` : ""}
          ${footerNote ? `<p style="margin:28px 0 0;color:#6b7280;font-size:13px;">${footerNote}</p>` : ""}
        </div>
      </div>
    </div>
  `
});

const buildOtpEmail = ({ name, otp, label }) => {
  const title = `${label} verification code`;
  const bodyHtml = `
    <p style="margin:0 0 14px;">Hi ${name || "there"},</p>
    <p style="margin:0 0 18px;">Use the one-time code below to continue with <strong>${APP_NAME}</strong>.</p>
    <div style="margin:0 0 18px;padding:18px 20px;border-radius:18px;background:#f8faff;border:1px solid #d9e2f2;text-align:center;">
      <div style="font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">One-time password</div>
      <div style="font-size:34px;font-weight:800;letter-spacing:0.32em;color:#1f2a44;">${otp}</div>
    </div>
    <p style="margin:0;">This code expires in <strong>10 minutes</strong>.</p>
  `;

  return buildEmailShell({
    eyebrow: APP_NAME,
    title,
    bodyHtml,
    footerNote: "If you did not request this code, you can safely ignore this email."
  });
};

const buildResetEmail = ({ name, resetLink }) => {
  const bodyHtml = `
    <p style="margin:0 0 14px;">Hi ${name || "there"},</p>
    <p style="margin:0 0 14px;">We received a request to reset your password for <strong>${APP_NAME}</strong>.</p>
    <p style="margin:0;">Use the secure button below to choose a new password.</p>
  `;

  return buildEmailShell({
    eyebrow: APP_NAME,
    title: "Reset your password",
    bodyHtml,
    actionLabel: "Open reset page",
    actionUrl: resetLink,
    footerNote: "This link will expire in 15 minutes for your security."
  });
};

const sendRegistrationOtpEmail = async (email, otp, name) => {
  const payload = buildOtpEmail({ name, otp, label: "Registration" });
  await sendEmail({
    to: email,
    subject: `Your ${APP_NAME} registration OTP`,
    text: payload.text,
    html: payload.html
  });
};

const sendResetEmail = async (email, resetLink, name) => {
  const payload = buildResetEmail({ name, resetLink });
  await sendEmail({
    to: email,
    subject: `Reset your ${APP_NAME} password`,
    text: [
      `Hi ${name || "there"},`,
      "",
      `Open this link to reset your ${APP_NAME} password:`,
      resetLink,
      "",
      "This link expires in 15 minutes."
    ].join("\n"),
    html: payload.html
  });
};

const withEmailDeliveryMessage = (error, fallbackMessage) => {
  const message = error?.message || "";

  if (
    message.includes("Email configuration is missing") ||
    message.includes("Missing credentials") ||
    message.includes("Invalid login") ||
    message.includes("Username and Password not accepted") ||
    message.includes("EAUTH") ||
    message.includes("ETIMEDOUT") ||
    message.includes("ECONNECTION") ||
    message.includes("Greeting never received")
  ) {
    return `${fallbackMessage} Check Render email settings (EMAIL_USER, EMAIL_PASS/app password, EMAIL_FROM).`;
  }

  return `${fallbackMessage} ${message}`.trim();
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
