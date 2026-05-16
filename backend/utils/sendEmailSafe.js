const sendEmail = require("./sendEmail");
const env = require("../config/env");

const EMAIL_TIMEOUT_MS = 8000;

/**
 * Sends email without failing the HTTP request (register/login must not hang on SMTP).
 */
const sendEmailSafe = async (to, subject, text) => {
  if (!env.emailUser || !env.emailPass) {
    console.warn("[email] Skipped — EMAIL_USER / EMAIL_PASS not configured.");
    return;
  }

  try {
    await Promise.race([
      sendEmail(to, subject, text),
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Email send timeout")), EMAIL_TIMEOUT_MS);
      })
    ]);
  } catch (error) {
    console.warn("[email] Failed (request still succeeds):", error.message);
  }
};

module.exports = sendEmailSafe;
