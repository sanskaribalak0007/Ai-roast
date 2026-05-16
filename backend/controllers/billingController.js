const crypto = require("crypto");
const User = require("../models/User");
const env = require("../config/env");
const { buildRazorpayReceipt } = require("../utils/razorpayReceipt");
const { CREDIT_PACKS, SUBSCRIPTION_PLANS } = require("../config/billing.config");
const {
  activateSubscriptionForUser,
  addPurchasedCredits,
  buildAccessState,
  ensureWeeklyCredits,
  ensureSubscriptionState
} = require("../services/usageService");

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

const getRazorpayAuthHeader = () => `Basic ${Buffer.from(`${env.razorpayKeyId}:${env.razorpayKeySecret}`).toString("base64")}`;

const assertRazorpayConfigured = () => {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) {
    throw new Error("Razorpay is not configured. Add Razorpay keys in backend .env.");
  }
};

const callRazorpay = async (path, options = {}) => {
  const response = await fetch(`${RAZORPAY_API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error?.description || data.error?.reason || "Razorpay request failed");
  }

  return data;
};

const verifySignature = (payload, signature) => crypto
  .createHmac("sha256", env.razorpayKeySecret)
  .update(payload)
  .digest("hex") === signature;

exports.getBillingConfig = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await ensureSubscriptionState(user);
    await ensureWeeklyCredits(user);

    const paymentsEnabled = Boolean(env.razorpayKeyId && env.razorpayKeySecret);
    const paymentsMode = env.razorpayKeyId?.startsWith("rzp_test_") ? "test" : "live";

    return res.json({
      razorpayKeyId: env.razorpayKeyId || "",
      payments: {
        enabled: paymentsEnabled,
        mode: paymentsMode
      },
      plans: SUBSCRIPTION_PLANS,
      creditPacks: Object.values(CREDIT_PACKS),
      access: buildAccessState(user)
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Unable to load billing config"
    });
  }
};

exports.createSubscriptionCheckout = async (req, res) => {
  try {
    assertRazorpayConfigured();
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const planKey = req.body?.planKey;
    const plan = SUBSCRIPTION_PLANS[planKey];

    if (!plan) {
      return res.status(400).json({ error: "Invalid subscription plan" });
    }

    const order = await callRazorpay("/orders", {
      method: "POST",
      body: {
        amount: plan.amount * 100,
        currency: "INR",
        receipt: buildRazorpayReceipt("sub"),
        notes: {
          userId: String(user._id),
          planKey
        }
      }
    });

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.razorpayKeyId,
      plan
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Unable to create subscription"
    });
  }
};

exports.verifySubscriptionCheckout = async (req, res) => {
  try {
    assertRazorpayConfigured();
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const {
      razorpay_payment_id: paymentId,
      razorpay_order_id: orderId,
      razorpay_signature: signature
    } = req.body || {};
    const planKey = req.body?.planKey;
    const plan = SUBSCRIPTION_PLANS[planKey];

    if (!paymentId || !orderId || !signature || !plan) {
      return res.status(400).json({ error: "Missing Razorpay subscription verification payload" });
    }

    const isValid = verifySignature(`${orderId}|${paymentId}`, signature);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid Razorpay signature" });
    }

    if (user.processedRazorpayPaymentIds.includes(paymentId)) {
      return res.json({
        message: "Subscription already verified",
        access: buildAccessState(user)
      });
    }

    await activateSubscriptionForUser(user, planKey, paymentId);

    return res.json({
      message: "Subscription activated successfully",
      access: buildAccessState(user)
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Unable to verify subscription"
    });
  }
};

exports.createCreditsOrder = async (req, res) => {
  try {
    assertRazorpayConfigured();
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const packKey = req.body?.packKey;
    const pack = CREDIT_PACKS[packKey];

    if (!pack) {
      return res.status(400).json({ error: "Invalid credit pack" });
    }

    const order = await callRazorpay("/orders", {
      method: "POST",
      body: {
        amount: pack.amount * 100,
        currency: "INR",
        receipt: buildRazorpayReceipt("cred"),
        notes: {
          userId: String(user._id),
          packKey
        }
      }
    });

    return res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: env.razorpayKeyId,
      pack
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Unable to create credit order"
    });
  }
};

exports.verifyCreditsOrder = async (req, res) => {
  try {
    assertRazorpayConfigured();
    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
      packKey
    } = req.body || {};

    const pack = CREDIT_PACKS[packKey];

    if (!orderId || !paymentId || !signature || !pack) {
      return res.status(400).json({ error: "Missing payment verification payload" });
    }

    const isValid = verifySignature(`${orderId}|${paymentId}`, signature);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid Razorpay signature" });
    }

    if (user.processedRazorpayPaymentIds.includes(paymentId)) {
      return res.json({
        message: "Credits already added for this payment",
        access: buildAccessState(user)
      });
    }

    await addPurchasedCredits(user, pack.credits);
    user.processedRazorpayPaymentIds.push(paymentId);
    await user.save();

    return res.json({
      message: "Credits added successfully",
      access: buildAccessState(user)
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Unable to verify credit payment"
    });
  }
};
