const isUploadFile = (value) =>
  typeof File !== "undefined" && value instanceof File && value.size > 0;

export async function fileToDataUrl(file) {
  const mimeType = file.type || "application/octet-stream";
  const buffer = Buffer.from(await file.arrayBuffer());
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function filesToDataUrls(values) {
  const uploads = values.filter(isUploadFile);
  return Promise.all(uploads.map(fileToDataUrl));
}
