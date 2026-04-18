import bcrypt from "bcryptjs";

import prisma from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/server/email";
import { normalizeEmail } from "@/lib/server/users";
import {
  normalizeBusinessType,
  toNumber,
  toStringArray,
  VENDOR_CATEGORIES,
} from "@/lib/server/vendor";
import { getDefaultVendorCommission } from "@/lib/server/services/settings.service";

const WITHDRAW_REQUEST_COOLDOWN_DAYS = 7;

function normalizeCategories(value) {
  return Array.from(
    new Set(
      toStringArray(value).map((entry) => entry.trim().toLowerCase()).filter(Boolean)
    )
  );
}

function validatePaymentDetails({
  accountHolderName,
  bankName,
  accountNumber,
  esewaId,
  fonepayId,
}) {
  const hasBankDetails = Boolean(accountHolderName && bankName && accountNumber);
  const hasDigitalWallet = Boolean(esewaId || fonepayId);

  return hasBankDetails || hasDigitalWallet;
}

function normalizeVendorProfileInput(payload = {}, commissionRate) {
  return {
    storeName: String(payload.storeName || "").trim(),
    businessType: normalizeBusinessType(payload.businessType),
    description: String(payload.description || "").trim(),
    logo: String(payload.logo || "").trim(),
    banner: String(payload.banner || "").trim() || null,
    address1: String(payload.address1 || "").trim(),
    address2: String(payload.address2 || "").trim() || null,
    city: String(payload.city || "").trim(),
    state: String(payload.state || "").trim(),
    pincode: String(payload.pincode || "").trim(),
    country: String(payload.country || "").trim(),
    accountHolderName: String(payload.accountHolderName || "").trim() || null,
    bankName: String(payload.bankName || "").trim() || null,
    accountNumber: String(payload.accountNumber || "").trim() || null,
    esewaId: String(payload.esewaId || "").trim() || null,
    fonepayId: String(payload.fonepayId || "").trim() || null,
    panNumber: String(payload.panNumber || "").trim(),
    citizenshipNumber: String(payload.citizenshipNumber || "").trim(),
    categories: normalizeCategories(payload.categories),
    termsAccepted: payload.termsAccepted === true || payload.termsAccepted === "true",
    commissionAccepted:
      payload.commissionAccepted === true || payload.commissionAccepted === "true",
    commissionRate,
    deliveryCharge: toNumber(payload.deliveryCharge),
    deliveryAreas: toStringArray(payload.deliveryAreas),
    pickupAddress1: String(payload.pickupAddress1 || "").trim() || null,
    pickupAddress2: String(payload.pickupAddress2 || "").trim() || null,
    pickupCity: String(payload.pickupCity || "").trim() || null,
    pickupState: String(payload.pickupState || "").trim() || null,
    pickupPincode: String(payload.pickupPincode || "").trim() || null,
    pickupCountry: String(payload.pickupCountry || "").trim() || null,
    notifyNewOrder:
      payload.notifyNewOrder === undefined
        ? true
        : payload.notifyNewOrder === true || payload.notifyNewOrder === "true",
    notifyPayment:
      payload.notifyPayment === undefined
        ? true
        : payload.notifyPayment === true || payload.notifyPayment === "true",
    notifyStock:
      payload.notifyStock === undefined
        ? true
        : payload.notifyStock === true || payload.notifyStock === "true",
  };
}

function validateVendorRegistrationPayload(payload) {
  const requiredFields = [
    payload.fullName,
    payload.email,
    payload.phone,
    payload.password,
    payload.storeName,
    payload.description,
    payload.logo,
    payload.address1,
    payload.city,
    payload.state,
    payload.pincode,
    payload.country,
    payload.panNumber,
    payload.citizenshipNumber,
  ];

  if (requiredFields.some((value) => !String(value || "").trim())) {
    throw new Error("All required vendor registration fields must be filled.");
  }

  if (!payload.termsAccepted || !payload.commissionAccepted) {
    throw new Error("Terms and commission agreement must be accepted.");
  }

  if (!validatePaymentDetails(payload)) {
    throw new Error(
      "Please provide either bank account details or an eSewa/Fonepay account."
    );
  }

  const categories = normalizeCategories(payload.categories);

  if (categories.length === 0) {
    throw new Error("Please select at least one store category.");
  }

  const invalidCategories = categories.filter(
    (category) => !VENDOR_CATEGORIES.includes(category)
  );

  if (invalidCategories.length > 0) {
    throw new Error(`Unsupported categories: ${invalidCategories.join(", ")}`);
  }
}

async function getVendorWithdrawStats(userId) {
  const [paymentHistory, withdrawRequests] = await Promise.all([
    prisma.paymentHistory.findMany({
      where: {
        vendorId: userId,
        status: {
          in: ["Ready", "Confirmed"],
        },
      },
      select: {
        netAmount: true,
      },
    }),
    prisma.withdrawRequest.findMany({
      where: {
        vendorId: userId,
        status: {
          in: ["Pending", "Approved", "Done"],
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        amount: true,
        createdAt: true,
      },
    }),
  ]);

  const totalEligible = paymentHistory.reduce(
    (sum, entry) => sum + Number(entry.netAmount ?? 0),
    0
  );
  const totalReserved = withdrawRequests.reduce(
    (sum, entry) => sum + Number(entry.amount ?? 0),
    0
  );

  return {
    totalEligible: Number(totalEligible.toFixed(2)),
    totalReserved: Number(totalReserved.toFixed(2)),
    availableBalance: Number(Math.max(0, totalEligible - totalReserved).toFixed(2)),
    latestRequestAt: withdrawRequests[0]?.createdAt || null,
  };
}

export async function registerVendor(payload = {}) {
  const email = normalizeEmail(payload.email);
  const commissionRate = await getDefaultVendorCommission();
  const normalizedProfile = normalizeVendorProfileInput(payload, commissionRate);

  validateVendorRegistrationPayload({
    ...payload,
    ...normalizedProfile,
    email,
  });

  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { vendorProfile: true },
  });

  if (existingUser?.isVerified) {
    throw new Error("An account with this email already exists.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  const hashedPassword = await bcrypt.hash(String(payload.password || ""), 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = existingUser
      ? await tx.user.update({
          where: { email },
          data: {
            name: String(payload.fullName || "").trim(),
            phoneNumber: String(payload.phone || "").trim(),
            password: hashedPassword,
            otp,
            otpExpiry,
            role: "vendor",
            isVendor: true,
            isApproved: false,
            isBlocked: false,
            isVerified: false,
          },
        })
      : await tx.user.create({
          data: {
            name: String(payload.fullName || "").trim(),
            phoneNumber: String(payload.phone || "").trim(),
            email,
            password: hashedPassword,
            otp,
            otpExpiry,
            role: "vendor",
            isVendor: true,
            isApproved: false,
            isBlocked: false,
            isVerified: false,
          },
        });

    const profile = existingUser?.vendorProfile
      ? await tx.vendorProfile.update({
          where: { userId: user.id },
          data: normalizedProfile,
        })
      : await tx.vendorProfile.create({
          data: {
            userId: user.id,
            ...normalizedProfile,
          },
        });

    return { user, profile };
  });

  const emailResult = await sendVerificationEmail(email, otp);

  return result;
}

export async function getVendorAccount(userId) {
  const vendor = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      vendorProfile: true,
    },
  });

  if (!vendor || !vendor.vendorProfile) {
    throw new Error("Vendor profile not found.");
  }

  return vendor;
}

export async function getVendorDashboardData(userId) {
  const vendor = await getVendorAccount(userId);
  const [products, orders, paymentHistory, withdrawRequests, reviews, payoutStats] =
    await Promise.all([
      prisma.product.findMany({
        where: { vendorId: userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.findMany({
        include: {
          user: {
            include: {
              vendorProfile: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.paymentHistory.findMany({
        where: { vendorId: userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.withdrawRequest.findMany({
        where: { vendorId: userId },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.findMany({
        where: { vendorId: userId },
        include: {
          author: {
            include: {
              vendorProfile: true,
            },
          },
          product: {
            include: {
              vendor: {
                include: {
                  vendorProfile: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      getVendorWithdrawStats(userId),
    ]);

  return {
    vendor,
    profile: vendor.vendorProfile,
    products,
    orders,
    paymentHistory,
    withdrawRequests,
    reviews,
    payoutStats,
  };
}

export async function updateVendorStore(userId, payload = {}) {
  await getVendorAccount(userId);

  return prisma.vendorProfile.update({
    where: { userId },
    data: {
      ...(payload.storeName ? { storeName: String(payload.storeName).trim() } : {}),
      ...(payload.description !== undefined
        ? { description: String(payload.description || "").trim() }
        : {}),
      ...(payload.logo ? { logo: String(payload.logo).trim() } : {}),
      ...(payload.banner !== undefined
        ? { banner: String(payload.banner || "").trim() || null }
        : {}),
      ...(payload.businessType
        ? { businessType: normalizeBusinessType(payload.businessType) }
        : {}),
      ...(payload.categories
        ? { categories: normalizeCategories(payload.categories) }
        : {}),
    },
  });
}

export async function updateVendorShipping(userId, payload = {}) {
  await getVendorAccount(userId);

  return prisma.vendorProfile.update({
    where: { userId },
    data: {
      deliveryCharge: toNumber(payload.deliveryCharge),
      deliveryAreas: toStringArray(payload.deliveryAreas),
      pickupAddress1: String(payload.pickupAddress1 || "").trim() || null,
      pickupAddress2: String(payload.pickupAddress2 || "").trim() || null,
      pickupCity: String(payload.pickupCity || "").trim() || null,
      pickupState: String(payload.pickupState || "").trim() || null,
      pickupPincode: String(payload.pickupPincode || "").trim() || null,
      pickupCountry: String(payload.pickupCountry || "").trim() || null,
    },
  });
}

export async function updateVendorNotifications(userId, payload = {}) {
  await getVendorAccount(userId);

  return prisma.vendorProfile.update({
    where: { userId },
    data: {
      notifyNewOrder:
        payload.notifyNewOrder === true || payload.notifyNewOrder === "true",
      notifyPayment:
        payload.notifyPayment === true || payload.notifyPayment === "true",
      notifyStock: payload.notifyStock === true || payload.notifyStock === "true",
    },
  });
}

export async function createWithdrawRequest(userId, payload = {}) {
  await getVendorAccount(userId);

  const amount = toNumber(payload.amount);
  const { availableBalance, latestRequestAt } = await getVendorWithdrawStats(userId);

  if (amount <= 0) {
    throw new Error("Withdraw amount must be greater than zero.");
  }

  if (amount > availableBalance) {
    throw new Error(`Withdraw amount exceeds your available balance of $${availableBalance}.`);
  }

  if (latestRequestAt) {
    const nextAllowedAt = new Date(latestRequestAt);
    nextAllowedAt.setDate(nextAllowedAt.getDate() + WITHDRAW_REQUEST_COOLDOWN_DAYS);

    if (nextAllowedAt > new Date()) {
      throw new Error("You can submit one payout request every 7 days.");
    }
  }

  return prisma.withdrawRequest.create({
    data: {
      vendorId: userId,
      amount,
      note: String(payload.note || "").trim() || null,
      status: "Pending",
    },
  });
}

export async function replyToReview(userId, reviewId, payload = {}) {
  await getVendorAccount(userId);

  const reply = String(payload.reply || "").trim();

  if (!reply) {
    throw new Error("Reply message is required.");
  }

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!review || review.vendorId !== userId) {
    throw new Error("Review not found.");
  }

  return prisma.review.update({
    where: { id: reviewId },
    data: { reply },
    include: {
      author: {
        include: {
          vendorProfile: true,
        },
      },
      product: {
        include: {
          vendor: {
            include: {
              vendorProfile: true,
            },
          },
        },
      },
    },
  });
}
