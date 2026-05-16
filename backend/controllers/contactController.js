const sendEmail = require("../utils/sendEmail");
const env = require("../config/env");

const normalizeEmail = (email = "") => email.trim().toLowerCase();

exports.submitContactForm = async (req, res) => {
  try {
    const name = req.body?.name?.trim();
    const email = normalizeEmail(req.body?.email);
    const message = req.body?.message?.trim();

    if (!name || !email || !message) {
      return res.status(400).json({
        message: "Name, email and suggestion are required"
      });
    }

    const subject = `New contact message from ${name}`;
    const text = [
      `Name: ${name}`,
      `Email: ${email}`,
      "",
      "Suggestion / Message:",
      message
    ].join("\n");

    await sendEmail(env.emailFrom || env.emailUser, subject, text);

    return res.json({
      message: "Your message has been sent successfully"
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};
