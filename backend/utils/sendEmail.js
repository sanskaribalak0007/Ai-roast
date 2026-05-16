const nodemailer = require("nodemailer");
const env = require("../config/env");

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

  return {
    service: env.emailService,
    auth: {
      user: env.emailUser,
      pass: env.emailPass
    }
  };
};

const sendEmail = async (to, subject, text) => {
  if (!env.emailUser || !env.emailPass) {
    throw new Error("Email configuration is missing");
  }

  const transporter = nodemailer.createTransport({
    ...buildTransportConfig(),
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000
  });

  await transporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    text
  });
};

module.exports = sendEmail;
