const nodemailer = require("nodemailer");
const env = require("../config/env");

const normalizePayload = (input, subject, text, html) => {
  if (typeof input === "object" && input !== null) {
    return {
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html
    };
  }

  return {
    to: input,
    subject,
    text,
    html
  };
};

const buildTransportConfig = () => {
  if (env.emailHost) {
    return {
      host: env.emailHost,
      port: env.emailPort,
      secure: env.emailSecure,
      auth: {
        user: env.emailUser,
        pass: env.emailPass
      }
    };
  }

  if ((env.emailService || "").toLowerCase() === "gmail") {
    return {
      host: "smtp.gmail.com",
      port: env.emailPort || 587,
      secure: env.emailSecure,
      auth: {
        user: env.emailUser,
        pass: env.emailPass
      }
    };
  }

  return {
    service: env.emailService,
    auth: {
      user: env.emailUser,
      pass: env.emailPass
    }
  };
};

const sendEmail = async (input, subject, text, html) => {
  if (!env.emailUser || !env.emailPass) {
    throw new Error("Email configuration is missing");
  }

  const payload = normalizePayload(input, subject, text, html);

  const transporter = nodemailer.createTransport({
    ...buildTransportConfig(),
    family: 4,
    pool: true,
    maxConnections: 1,
    connectionTimeout: 20000,
    greetingTimeout: 20000,
    socketTimeout: 30000,
    tls: {
      servername: env.emailHost || "smtp.gmail.com"
    }
  });

  await transporter.sendMail({
    from: env.emailFrom,
    to: payload.to,
    subject: payload.subject,
    text: payload.text,
    html: payload.html || undefined
  });

  transporter.close();
};

module.exports = sendEmail;
