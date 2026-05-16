const nodemailer = require("nodemailer");
const env = require("../config/env");

const sendEmail = async (to,subject,text) => {
  if (!env.emailUser || !env.emailPass) {
    throw new Error("Email configuration is missing");
  }

  const transporter = nodemailer.createTransport({

    service:env.emailService,

    auth:{
      user:env.emailUser,
      pass:env.emailPass
    }

  });

  await transporter.sendMail({

    from:env.emailFrom,
    to,
    subject,
    text

  });

};

module.exports = sendEmail;
