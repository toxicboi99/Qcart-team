import API_URL from "@/lib/api";
import { buildSessionHeaders } from "@/lib/client-auth";

export async function fetchWithSession(path, options = {}) {
  const {
    sessionSource = "user",
    headers = {},
    body,
    ...rest
  } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...buildSessionHeaders(sessionSource),
      ...headers,
    },
    ...(body !== undefined ? { body } : {}),
  });

  const data = await response.json().catch(() => ({}));

  return {
    response,
    data,
  };
}
