export function formDataToObject(formData) {
  const data = {};

  for (const [key, value] of formData.entries()) {
    if (key in data) {
      const current = data[key];
      data[key] = Array.isArray(current) ? [...current, value] : [current, value];
      continue;
    }

    data[key] = value;
  }

  return data;
}

export async function parseRequestData(request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    return {
      type: "formData",
      formData,
      data: formDataToObject(formData),
    };
  }

  return {
    type: "json",
    data: await request.json(),
  };
}
