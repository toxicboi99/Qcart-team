import crypto from "node:crypto";

import { fileToDataUrl } from "@/lib/server/images";

function getCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
  };
}

export function isCloudinaryConfigured() {
  const config = getCloudinaryConfig();
  return Boolean(config.cloudName && config.apiKey && config.apiSecret);
}

function createSignature(params, apiSecret) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${payload}${apiSecret}`)
    .digest("hex");
}

export async function uploadImageFileToCloudinary(file, options = {}) {
  if (!file || typeof file.arrayBuffer !== "function" || file.size <= 0) {
    return null;
  }

  const config = getCloudinaryConfig();

  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const params = {
    folder: options.folder || "qcart/payment-screenshots",
    timestamp,
  };

  const body = new FormData();
  body.set("file", await fileToDataUrl(file));
  body.set("api_key", config.apiKey);
  body.set("timestamp", String(timestamp));
  body.set("folder", params.folder);
  body.set("signature", createSignature(params, config.apiSecret));

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    {
      method: "POST",
      body,
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result?.error?.message || "Cloudinary upload failed.");
  }

  return {
    secureUrl: result.secure_url,
    publicId: result.public_id,
  };
}
