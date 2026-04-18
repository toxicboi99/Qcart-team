import prisma from "@/lib/prisma";
import {
  APP_SETTING_KEYS,
  DEFAULT_VENDOR_COMMISSION,
  toNumber,
} from "@/lib/server/vendor";

export async function getSetting(key, fallback = null) {
  const setting = await prisma.appSetting.findUnique({
    where: { key },
  });

  return setting?.value ?? fallback;
}

export async function upsertSetting(key, value) {
  return prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: {
      key,
      value,
    },
  });
}

export async function getDefaultVendorCommission() {
  const setting = await getSetting(
    APP_SETTING_KEYS.defaultVendorCommission,
    DEFAULT_VENDOR_COMMISSION
  );

  return toNumber(setting, DEFAULT_VENDOR_COMMISSION);
}

export async function setDefaultVendorCommission(rate) {
  const normalizedRate = Math.max(0, Math.min(100, toNumber(rate, DEFAULT_VENDOR_COMMISSION)));

  return upsertSetting(APP_SETTING_KEYS.defaultVendorCommission, normalizedRate);
}
