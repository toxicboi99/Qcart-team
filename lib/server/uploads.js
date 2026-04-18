import { isCloudinaryConfigured, uploadImageFileToCloudinary } from "@/lib/server/cloudinary";
import { fileToDataUrl } from "@/lib/server/images";

function isUploadFile(value) {
  return typeof File !== "undefined" && value instanceof File && value.size > 0;
}

export async function uploadSingleImage(file, options = {}) {
  if (!isUploadFile(file)) {
    return "";
  }

  if (isCloudinaryConfigured()) {
    const uploaded = await uploadImageFileToCloudinary(file, options);
    return uploaded?.secureUrl || "";
  }

  return fileToDataUrl(file);
}

export async function uploadImages(files = [], options = {}) {
  const uploads = files.filter(isUploadFile);
  return Promise.all(uploads.map((file) => uploadSingleImage(file, options)));
}
