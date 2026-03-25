import nodemailer from "nodemailer";

const globalForMailer = globalThis;
const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "$";

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(amount) {
  const number = Number(amount);

  if (!Number.isFinite(number)) {
    return `${DEFAULT_CURRENCY}0`;
  }

  return `${DEFAULT_CURRENCY}${number.toFixed(2)}`;
}

function getStatusTheme(status) {
  switch (status) {
    case "Completed":
      return {
        accent: "#15803d",
        soft: "#dcfce7",
        text: "#166534",
        label: "Delivered",
      };
    case "Processing":
      return {
        accent: "#2563eb",
        soft: "#dbeafe",
        text: "#1d4ed8",
        label: "Processing",
      };
    case "Cancelled":
      return {
        accent: "#dc2626",
        soft: "#fee2e2",
        text: "#b91c1c",
        label: "Cancelled",
      };
    default:
      return {
        accent: "#ea580c",
        soft: "#ffedd5",
        text: "#c2410c",
        label: "Pending",
      };
  }
}

function formatAddress(address = {}) {
  return [
    address.fullName,
    address.area,
    [address.city, address.state].filter(Boolean).join(", "),
    address.pincode,
    address.phoneNumber,
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line))
    .join("<br/>");
}

function normalizeOrderItems(items = []) {
  return Array.isArray(items)
    ? items.map((item) => {
        const product = item?.product || {};
        const quantity = Number(item?.quantity) || 0;
        const unitPrice = Number(
          product.offerPrice ?? product.price ?? item?.offerPrice ?? item?.price
        );

        return {
          name: product.name || item?.name || "Product",
          category: product.category || item?.category || "",
          quantity,
          unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
          lineTotal:
            quantity > 0 && Number.isFinite(unitPrice) ? quantity * unitPrice : 0,
        };
      })
    : [];
}

function buildOrderStatusEmail({ userName, order, previousStatus }) {
  const status = order?.status || "Pending";
  const theme = getStatusTheme(status);
  const shortOrderId = order?.id ? order.id.slice(-8).toUpperCase() : "ORDER";
  const createdAt = order?.createdAt
    ? new Date(order.createdAt).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";
  const items = normalizeOrderItems(order?.items);
  const itemsMarkup = items
    .map(
      (item) => `
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="font-size: 14px; font-weight: 700; color: #111827;">${escapeHtml(item.name)}</div>
            ${
              item.category
                ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${escapeHtml(item.category)}</div>`
                : ""
            }
          </td>
          <td style="padding: 14px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151; text-align: center;">${item.quantity}</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151; text-align: right;">${formatCurrency(item.unitPrice)}</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: 700; color: #111827; text-align: right;">${formatCurrency(item.lineTotal)}</td>
        </tr>
      `
    )
    .join("");

  const textItems = items
    .map(
      (item) =>
        `- ${item.name} x ${item.quantity} | ${formatCurrency(item.unitPrice)} each | ${formatCurrency(item.lineTotal)}`
    )
    .join("\n");

  const title =
    status === "Completed"
      ? "Your order has been delivered"
      : status === "Cancelled"
        ? "Your order has been cancelled"
        : `Your order is now ${status.toLowerCase()}`;

  const intro =
    status === "Completed"
      ? "Everything is wrapped up and your order has reached its final stop."
      : status === "Cancelled"
        ? "We wanted to let you know that this order will not be fulfilled."
        : "We wanted to keep you updated as your order moves through our system.";

  const previousStatusMarkup = previousStatus
    ? `
      <div style="margin-top: 12px; font-size: 12px; color: #6b7280;">
        Previous status: <strong style="color: #111827;">${escapeHtml(previousStatus)}</strong>
      </div>
    `
    : "";

  const html = `
    <div style="margin: 0; padding: 32px 16px; background: linear-gradient(180deg, #fff7ed 0%, #f8fafc 100%); font-family: Arial, Helvetica, sans-serif; color: #111827;">
      <div style="max-width: 720px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden; box-shadow: 0 14px 40px rgba(15, 23, 42, 0.08);">
        <div style="padding: 28px 32px; background: linear-gradient(135deg, ${theme.accent} 0%, #111827 100%); color: #ffffff;">
          <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.9;">QuickCart Order Update</div>
          <div style="margin-top: 12px; font-size: 28px; line-height: 1.25; font-weight: 800;">${escapeHtml(title)}</div>
          <div style="margin-top: 10px; font-size: 14px; line-height: 1.7; max-width: 520px; opacity: 0.92;">
            Hi ${escapeHtml(userName || "there")}, ${escapeHtml(intro)}
          </div>
        </div>

        <div style="padding: 28px 32px;">
          <div style="display: inline-block; padding: 10px 16px; border-radius: 999px; background: ${theme.soft}; color: ${theme.text}; font-size: 13px; font-weight: 800; letter-spacing: 0.04em; text-transform: uppercase;">
            Current Status: ${escapeHtml(theme.label)}
          </div>
          ${previousStatusMarkup}

          <div style="margin-top: 24px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;">
            <div style="padding: 18px; border: 1px solid #e5e7eb; border-radius: 18px; background: #fcfcfd;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Order ID</div>
              <div style="margin-top: 6px; font-size: 18px; font-weight: 800; color: #111827;">#${escapeHtml(shortOrderId)}</div>
            </div>
            <div style="padding: 18px; border: 1px solid #e5e7eb; border-radius: 18px; background: #fcfcfd;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Order Total</div>
              <div style="margin-top: 6px; font-size: 18px; font-weight: 800; color: #111827;">${formatCurrency(order?.amount)}</div>
            </div>
            <div style="padding: 18px; border: 1px solid #e5e7eb; border-radius: 18px; background: #fcfcfd;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Payment</div>
              <div style="margin-top: 6px; font-size: 15px; font-weight: 700; color: #111827;">${escapeHtml(order?.paymentMethod || "COD")} &middot; ${escapeHtml(order?.paymentStatus || "Pending")}</div>
            </div>
            <div style="padding: 18px; border: 1px solid #e5e7eb; border-radius: 18px; background: #fcfcfd;">
              <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Ordered On</div>
              <div style="margin-top: 6px; font-size: 15px; font-weight: 700; color: #111827;">${escapeHtml(createdAt || "Recently")}</div>
            </div>
          </div>

          <div style="margin-top: 26px; padding: 22px; border-radius: 22px; background: #fff7ed; border: 1px solid #fdba74;">
            <div style="font-size: 13px; color: #9a3412; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 800;">Delivery Snapshot</div>
            <div style="margin-top: 10px; font-size: 14px; line-height: 1.75; color: #431407;">${formatAddress(order?.address)}</div>
          </div>

          <div style="margin-top: 30px;">
            <div style="font-size: 18px; font-weight: 800; color: #111827;">Items in this order</div>
            <div style="margin-top: 14px; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; background: #ffffff;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th align="left" style="padding: 14px 18px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Product</th>
                    <th align="center" style="padding: 14px 18px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Qty</th>
                    <th align="right" style="padding: 14px 18px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Price</th>
                    <th align="right" style="padding: 14px 18px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsMarkup || `
                    <tr>
                      <td colspan="4" style="padding: 18px; text-align: center; font-size: 14px; color: #6b7280;">No item details were available for this order.</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Hi ${userName || "there"},`,
    "",
    `Your QuickCart order status is now ${status}.`,
    previousStatus ? `Previous status: ${previousStatus}` : "",
    `Order ID: #${shortOrderId}`,
    `Amount: ${formatCurrency(order?.amount)}`,
    `Payment: ${order?.paymentMethod || "COD"} / ${order?.paymentStatus || "Pending"}`,
    createdAt ? `Ordered on: ${createdAt}` : "",
    "",
    "Items:",
    textItems || "- No item details available",
    "",
    "Delivery address:",
    [
      order?.address?.fullName,
      order?.address?.area,
      [order?.address?.city, order?.address?.state].filter(Boolean).join(", "),
      order?.address?.pincode,
      order?.address?.phoneNumber,
    ]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject: `QuickCart order update: ${status} (#${shortOrderId})`,
    html,
    text,
  };
}

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

export async function sendOrderStatusEmail({ email, userName, order, previousStatus }) {
  const config = getEmailConfig();

  if (!config.configured) {
    return { delivered: false };
  }

  const transporter = getTransporter();
  const message = buildOrderStatusEmail({
    userName,
    order,
    previousStatus,
  });

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });

  return { delivered: true };
}
