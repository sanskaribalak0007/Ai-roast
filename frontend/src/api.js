import { request } from "./api/httpClient";

export const api = {
  getBillingConfig: () => request("/api/billing/config"),
  createSubscriptionCheckout: (planKey) =>
    request("/api/billing/subscription/create", {
      method: "POST",
      body: JSON.stringify({ planKey })
    }),
  verifySubscriptionCheckout: (payload) =>
    request("/api/billing/subscription/verify", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  createCreditsOrder: (packKey) =>
    request("/api/billing/credits/create-order", {
      method: "POST",
      body: JSON.stringify({ packKey })
    }),
  verifyCreditsOrder: (payload) =>
    request("/api/billing/credits/verify", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  logout: () => request("/api/auth/logout"),
  checkAuth: () => request("/api/auth/check"),
  forgotPassword: (payload) =>
    request("/api/auth/forgot", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  resetPassword: (token, payload) =>
    request(`/api/auth/reset/${token}`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  sendContactMessage: (payload) =>
    request("/api/contact", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  scrapeWebsite: (url) =>
    request("/api/tools/scrape", {
      method: "POST",
      body: JSON.stringify({ url })
    }),
  auditWebsite: (url) =>
    request("/api/tools/audit", {
      method: "POST",
      body: JSON.stringify({ url })
    }),
  sendMessage: (payload) =>
    request("/api/chat", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  uploadFile: (formData) =>
    request("/api/chat/upload", {
      method: "POST",
      body: formData
    }),
  getHistory: (search = "") =>
    request(`/api/chat/history${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getChat: (chatId, search = "") =>
    request(`/api/chat/${chatId}${search ? `?search=${encodeURIComponent(search)}` : ""}`),
  getSharedChat: (shareToken) => request(`/api/chat/share/${shareToken}`),
  createShareLink: (chatId) =>
    request(`/api/chat/${chatId}/share`, {
      method: "POST"
    }),
  renameChat: (chatId, title) =>
    request(`/api/chat/${chatId}/title`, {
      method: "PATCH",
      body: JSON.stringify({ title })
    }),
  editMessage: (chatId, messageId, content) =>
    request(`/api/chat/${chatId}/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify({ content })
    }),
  deleteChat: (chatId) =>
    request(`/api/chat/${chatId}`, {
      method: "DELETE"
    })
};
