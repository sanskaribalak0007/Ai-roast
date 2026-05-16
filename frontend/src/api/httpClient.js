import { appConfig } from "../config/app.config";

const extractErrorMessage = (data) => {
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (typeof data?.error?.description === "string") {
    return data.error.description;
  }

  return "Request failed";
};

export const request = async (path, options = {}) => {
  const response = await fetch(`${appConfig.apiUrl}${path}`, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {})
    }
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  return data;
};
