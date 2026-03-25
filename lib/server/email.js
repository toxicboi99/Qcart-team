import nodemailer from "nodemailer";

const globalForMailer = globalThis;

function getEmailConfig() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from =
    process.env.FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER;

  return {
    host,
    port,
    user,
    pass,
    from,
    configured: Boolean(host && user && pass && from),
  };
}

function getTransporter() {
  const config = getEmailConfig();

  if (!config.configured) {
    return null;
  }

  if (!globalForMailer.quickcartMailer) {
    globalForMailer.quickcartMailer = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465,
      auth: {
        user: config.user,
        pass: config.pass,
      },
    });
  }

  return globalForMailer.quickcartMailer;
}

export async function sendVerificationEmail(email, otp) {
  const config = getEmailConfig();

  if (!config.configured) {
    console.warn(`OTP for ${email}: ${otp}`);
    return {
      delivered: false,
      previewOtp: otp,
    };
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Your QuickCart verification code",
    text: `Your QuickCart verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your QuickCart verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });

  return { delivered: true };
}

export async function sendAccountCreatedEmail(email, name) {
  const config = getEmailConfig();

  if (!config.configured) {
    return { delivered: false };
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: "Your QuickCart account is ready",
    text: `Hi ${name}, your QuickCart account has been created successfully.`,
    html: `<p>Hi ${name},</p><p>Your QuickCart account has been created successfully.</p>`,
  });

  return { delivered: true };
}
