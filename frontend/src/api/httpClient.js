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

const buildNetworkError = (error) => {
  if (error?.name === "TypeError" || error?.message === "Failed to fetch") {
    return new Error(
      `Cannot reach API at ${appConfig.apiUrl}. Rebuild frontend with VITE_API_URL pointing to Render, and set CORS_ORIGINS on the backend.`
    );
  }

  return error;
};

export const request = async (path, options = {}) => {
  if (!appConfig.apiUrl) {
    throw new Error("VITE_API_URL is missing. Rebuild the frontend for production.");
  }

  let response;

  try {
    response = await fetch(`${appConfig.apiUrl}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {})
      }
    });
  } catch (error) {
    throw buildNetworkError(error);
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(extractErrorMessage(data));
  }

  return data;
};
