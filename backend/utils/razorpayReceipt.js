const crypto = require("crypto");

/** Razorpay allows receipt IDs up to 40 characters. */
const RAZORPAY_RECEIPT_MAX_LENGTH = 40;

/**
 * Builds a unique receipt string within Razorpay's 40-character limit.
 * User/order context should go in order `notes`, not the receipt field.
 */
const buildRazorpayReceipt = (prefix = "ord") => {
  const safePrefix = String(prefix).replace(/[^a-z0-9]/gi, "").slice(0, 8) || "ord";
  const stamp = Date.now().toString(36);
  const nonce = crypto.randomBytes(3).toString("hex");
  return `${safePrefix}_${stamp}_${nonce}`.slice(0, RAZORPAY_RECEIPT_MAX_LENGTH);
};

module.exports = {
  RAZORPAY_RECEIPT_MAX_LENGTH,
  buildRazorpayReceipt
};
