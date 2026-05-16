/**
 * Central frontend configuration — values come from Vite env with safe defaults.
 */
export const appConfig = {
  name: import.meta.env.VITE_APP_NAME || "AI Roast Studio",
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000",
  currencySymbol: import.meta.env.VITE_CURRENCY_SYMBOL || "Rs.",
  razorpayThemeColor: import.meta.env.VITE_RAZORPAY_THEME_COLOR || "#4f46e5"
};
