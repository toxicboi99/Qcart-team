import nodemailer from "nodemailer";

const globalForMailer = globalThis;
const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || "$";

function normalizeEnvValue(value = "") {
  return String(value || "").trim().replace(/^['"]|['"]$/g, "");
}

function normalizeSmtpPassword(host = "", value = "") {
  const normalized = normalizeEnvValue(value);

  if (!normalized) {
    return "";
  }

  const gmailLikeHost = String(host).toLowerCase().includes("gmail");
  const compact = normalized.replace(/\s+/g, "");
  const looksLikeGroupedAppPassword =
    /^[a-z0-9]{4}(\s[a-z0-9]{4}){3}$/i.test(normalized) && compact.length === 16;

  if (gmailLikeHost && looksLikeGroupedAppPassword) {
    return compact;
  }

  return normalized;
}

function normalizeFromAddress(from = "", user = "") {
  const normalizedFrom = normalizeEnvValue(from);
  const normalizedUser = normalizeEnvValue(user);

  if (!normalizedFrom) {
    return normalizedUser;
  }

  if (normalizedFrom.includes("@") || !normalizedUser) {
    return normalizedFrom;
  }

  return `"${normalizedFrom}" <${normalizedUser}>`;
}

function createEmailDeliveryError(message, cause) {
  const error = new Error(message);
  error.statusCode = 502;
  error.cause = cause;
  return error;
}

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

function buildVendorItemsMarkup(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const product = item?.product || {};
      const quantity = Number(item?.quantity) || 0;
      const unitPrice = Number(product.offerPrice ?? product.price ?? 0);
      const lineTotal = Number.isFinite(unitPrice) ? unitPrice * quantity : 0;

      return `
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
            <div style="font-size: 14px; font-weight: 700; color: #111827;">${escapeHtml(product.name || "Product")}</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${escapeHtml(product.category || "General")}</div>
          </td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${quantity}</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(lineTotal)}</td>
        </tr>
      `;
    })
    .join("");
}

function buildVendorNotificationEmail({
  userName,
  storeName,
  title,
  intro,
  accent,
  order,
  items = [],
  footerNote = "",
}) {
  const shortOrderId = order?.id ? order.id.slice(-8).toUpperCase() : "ORDER";
  const rows = buildVendorItemsMarkup(items);

  return {
    subject: `${storeName || "QuickCart"}: ${title} (#${shortOrderId})`,
    html: `
      <div style="margin: 0; padding: 32px 16px; background: #f8fafc; font-family: Arial, Helvetica, sans-serif; color: #111827;">
        <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 24px; overflow: hidden;">
          <div style="padding: 28px 32px; background: linear-gradient(135deg, ${accent} 0%, #111827 100%); color: white;">
            <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; opacity: 0.9;">Vendor Alert</div>
            <div style="margin-top: 12px; font-size: 28px; font-weight: 800;">${escapeHtml(title)}</div>
            <div style="margin-top: 10px; font-size: 14px; line-height: 1.7;">
              Hi ${escapeHtml(userName || "there")}, ${escapeHtml(intro)}
            </div>
          </div>
          <div style="padding: 28px 32px;">
            <div style="display: inline-block; padding: 10px 16px; border-radius: 999px; background: #eff6ff; color: ${accent}; font-size: 12px; font-weight: 800; text-transform: uppercase;">
              Store: ${escapeHtml(storeName || "QuickCart")}
            </div>
            <div style="margin-top: 22px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px;">
              <div style="padding: 18px; border: 1px solid #e5e7eb; border-radius: 18px;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Order ID</div>
                <div style="margin-top: 6px; font-size: 18px; font-weight: 800;">#${escapeHtml(shortOrderId)}</div>
              </div>
              <div style="padding: 18px; border: 1px solid #e5e7eb; border-radius: 18px;">
                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.08em;">Order Amount</div>
                <div style="margin-top: 6px; font-size: 18px; font-weight: 800;">${formatCurrency(order?.amount)}</div>
              </div>
            </div>
            <div style="margin-top: 24px; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th align="left" style="padding: 14px 18px; font-size: 12px; color: #6b7280; text-transform: uppercase;">Product</th>
                    <th align="center" style="padding: 14px 18px; font-size: 12px; color: #6b7280; text-transform: uppercase;">Qty</th>
                    <th align="right" style="padding: 14px 18px; font-size: 12px; color: #6b7280; text-transform: uppercase;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${rows || `<tr><td colspan="3" style="padding: 18px; text-align: center; color: #6b7280;">No vendor items found.</td></tr>`}
                </tbody>
              </table>
            </div>
            ${
              footerNote
                ? `<div style="margin-top: 18px; font-size: 13px; line-height: 1.7; color: #475569;">${escapeHtml(footerNote)}</div>`
                : ""
            }
          </div>
        </div>
      </div>
    `,
    text: [
      `Hi ${userName || "there"},`,
      "",
      title,
      intro,
      `Store: ${storeName || "QuickCart"}`,
      `Order ID: #${shortOrderId}`,
      `Amount: ${formatCurrency(order?.amount)}`,
      "",
      ...(Array.isArray(items)
        ? items.map((item) => {
            const product = item?.product || {};
            const quantity = Number(item?.quantity) || 0;
            const unitPrice = Number(product.offerPrice ?? product.price ?? 0);
            const lineTotal = Number.isFinite(unitPrice) ? unitPrice * quantity : 0;
            return `- ${product.name || "Product"} x ${quantity} | ${formatCurrency(lineTotal)}`;
          })
        : []),
      "",
      footerNote,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function getEmailConfig() {
  const host = normalizeEnvValue(process.env.SMTP_HOST);
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = normalizeEnvValue(process.env.SMTP_USER);
  const pass = normalizeSmtpPassword(host, process.env.SMTP_PASS);
  const from = normalizeFromAddress(
    process.env.FROM_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER,
    user
  );

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
    const isGmail = String(config.host).toLowerCase() === "smtp.gmail.com";

    globalForMailer.quickcartMailer = nodemailer.createTransport(
      isGmail
        ? {
            service: "gmail",
            auth: {
              user: config.user,
              pass: config.pass,
            },
          }
        : {
            host: config.host,
            port: config.port,
            secure: config.port === 465,
            auth: {
              user: config.user,
              pass: config.pass,
            },
          }
    );
  }

  return globalForMailer.quickcartMailer;
}

export async function sendVerificationEmail(email, otp) {
  const config = getEmailConfig();

  if (!config.configured) {
    throw createEmailDeliveryError("Email service is not configured.");
  }

  const transporter = getTransporter();

  try {
    await transporter.sendMail({
      from: config.from,
      to: email,
      subject: "Your QuickCart verification code",
      text: `Your QuickCart verification code is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your QuickCart verification code is <strong>${otp}</strong>.</p><p>It expires in 10 minutes.</p>`,
    });
  } catch (error) {
    throw createEmailDeliveryError(
      "Unable to send verification email via Gmail. Check the Gmail app password and 2-Step Verification settings.",
      error
    );
  }

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

export async function sendVendorNewOrderEmail({
  email,
  userName,
  order,
  items,
  storeName,
}) {
  const config = getEmailConfig();

  if (!config.configured) {
    return { delivered: false };
  }

  const transporter = getTransporter();
  const message = buildVendorNotificationEmail({
    userName,
    storeName,
    title: "You received a new order",
    intro: "A customer has placed an order that includes products from your store.",
    accent: "#2563eb",
    order,
    items,
    footerNote: "Review the order in your vendor dashboard and accept or reject it as needed.",
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

export async function sendVendorPaymentStatusEmail({
  email,
  userName,
  order,
  paymentStatus,
  items,
  storeName,
}) {
  const config = getEmailConfig();

  if (!config.configured) {
    return { delivered: false };
  }

  const transporter = getTransporter();
  const message = buildVendorNotificationEmail({
    userName,
    storeName,
    title: `Payment marked as ${paymentStatus}`,
    intro: "The order payment status has been updated for one of your vendor orders.",
    accent: "#16a34a",
    order,
    items,
    footerNote: `Current payment status: ${paymentStatus}`,
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

export async function sendVendorPayoutStatusEmail({
  email,
  userName,
  amount,
  status,
  requestId,
  storeName,
  note,
}) {
  const config = getEmailConfig();

  if (!config.configured) {
    return { delivered: false };
  }

  const transporter = getTransporter();
  const normalizedStatus = String(status || "Pending").trim();
  const shortRequestId = String(requestId || "PAYOUT").slice(-8).toUpperCase();
  const accent =
    normalizedStatus === "Done"
      ? "#16a34a"
      : normalizedStatus === "Approved"
        ? "#2563eb"
        : normalizedStatus === "Rejected"
          ? "#dc2626"
          : "#ea580c";
  const message = buildVendorNotificationEmail({
    userName,
    storeName,
    title: `Payout request ${normalizedStatus.toLowerCase()}`,
    intro: "Your vendor payout request has been updated by the QuickCart admin team.",
    accent,
    order: {
      id: requestId || shortRequestId,
      amount,
    },
    items: [],
    footerNote: [
      `Request reference: #${shortRequestId}`,
      note ? `Note: ${note}` : "",
      normalizedStatus === "Done"
        ? "The payout has been marked as completed."
        : normalizedStatus === "Approved"
          ? "Your payout request has been approved and is being prepared."
          : "",
    ]
      .filter(Boolean)
      .join(" "),
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

export async function sendLowStockAlertEmail({
  email,
  userName,
  product,
  storeName,
}) {
  const config = getEmailConfig();

  if (!config.configured) {
    return { delivered: false };
  }

  const transporter = getTransporter();
  const stock = Number(product?.stock ?? 0);
  const productName = product?.name || "Product";

  await transporter.sendMail({
    from: config.from,
    to: email,
    subject: `${storeName || "QuickCart"} low stock alert: ${productName}`,
    text: `Hi ${userName || "there"}, ${productName} is running low on stock. Remaining stock: ${stock}.`,
    html: `<p>Hi ${escapeHtml(userName || "there")},</p><p><strong>${escapeHtml(productName)}</strong> is running low on stock.</p><p>Remaining stock: <strong>${stock}</strong></p>`,
  });

  return { delivered: true };
}
