const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER || process.env.EMAIL_USER;
    const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (!user || !pass) {
        throw new Error('Email credentials are not configured. Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASS in .env');
    }

    transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass,
        },
    });

    return transporter;
}

async function sendEmail({ to, subject, text, html }) {
    const mailer = getTransporter();

    const from =
        process.env.FROM_EMAIL ||
        process.env.SMTP_FROM ||
        process.env.SMTP_USER ||
        process.env.EMAIL_USER;

    if (!from) {
        throw new Error('FROM_EMAIL / SMTP_FROM / SMTP_USER / EMAIL_USER must be set');
    }

    await mailer.sendMail({
        from,
        to,
        subject,
        text,
        html,
    });
}

async function sendVerificationEmail(email, otp) {
    const subject = 'Your QuickCart verification code';
    const text = `Your QuickCart verification code is ${otp}. This code will expire in 10 minutes.`;
    const html = `<p>Your QuickCart verification code is <strong>${otp}</strong>.</p><p>This code will expire in 10 minutes.</p>`;

    await sendEmail({ to: email, subject, text, html });
}

async function sendAccountCreatedEmail(email, name) {
    const subject = 'Your QuickCart account has been created';
    const text = `Hi ${name || ''}, your QuickCart account has been created and verified successfully.`.trim();
    const html = `<p>Hi ${name || ''},</p><p>Your QuickCart account has been created and verified successfully.</p>`;

    await sendEmail({ to: email, subject, text, html });
}

module.exports = {
    sendEmail,
    sendVerificationEmail,
    sendAccountCreatedEmail,
};

