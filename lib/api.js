const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export default API_URL;

export const buildApiUrl = (path = "") => {
  if (!path) {
    return API_URL;
  }

  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
};
