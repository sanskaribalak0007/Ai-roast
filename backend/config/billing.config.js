/**
 * Billing catalog — amounts are in INR (rupees) before Razorpay paise conversion.
 */
const DAY_MS = 1000 * 60 * 60 * 24;
const WEEKLY_SUBSCRIPTION_CREDITS = 50;

const CREDIT_PACKS = {
  pack_99: {
    key: "pack_99",
    label: "50 Credits",
    amount: 99,
    credits: 50
  },
  pack_499: {
    key: "pack_499",
    label: "300 Credits",
    amount: 499,
    credits: 300
  },
  pack_999: {
    key: "pack_999",
    label: "750 Credits",
    amount: 999,
    credits: 750
  }
};

const SUBSCRIPTION_PLANS = {
  pro_weekly: {
    key: "pro_weekly",
    label: "Pro Weekly",
    amount: 199,
    durationMs: 7 * DAY_MS,
    weeklyCredits: WEEKLY_SUBSCRIPTION_CREDITS
  },
  pro_monthly: {
    key: "pro_monthly",
    label: "Pro Monthly",
    amount: 599,
    durationMs: 30 * DAY_MS,
    weeklyCredits: WEEKLY_SUBSCRIPTION_CREDITS
  },
  pro_yearly: {
    key: "pro_yearly",
    label: "Pro Yearly",
    amount: 3999,
    durationMs: 365 * DAY_MS,
    weeklyCredits: WEEKLY_SUBSCRIPTION_CREDITS
  }
};

module.exports = {
  CREDIT_PACKS,
  SUBSCRIPTION_PLANS,
  WEEKLY_SUBSCRIPTION_CREDITS
};
