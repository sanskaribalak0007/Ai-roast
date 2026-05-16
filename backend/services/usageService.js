const {
  CREDIT_PACKS,
  SUBSCRIPTION_PLANS,
  WEEKLY_SUBSCRIPTION_CREDITS
} = require("../config/billing.config");

const FREE_CHAT_MESSAGE_LIMIT = 40;
const PRO_CHAT_MESSAGE_LIMIT = 200;
const FREE_CHAT_IMAGE_LIMIT = 3;
const PRO_CHAT_IMAGE_LIMIT = 20;
const WEEKLY_RESET_MS = 1000 * 60 * 60 * 24 * 7;

const isSubscriptionActive = (user) => {
  if (!user) {
    return false;
  }

  if (Number(user.subscribed) !== 1) {
    return false;
  }

  if (!user.subscriptionCurrentEnd) {
    return false;
  }

  return new Date(user.subscriptionCurrentEnd).getTime() > Date.now();
};

const ensureSubscriptionState = async (user) => {
  if (!user) {
    return false;
  }

  const expired = user.subscriptionCurrentEnd && new Date(user.subscriptionCurrentEnd).getTime() <= Date.now();

  if (Number(user.subscribed) === 1 && expired) {
    user.subscribed = 0;
    user.subscriptionStatus = "inactive";
    user.subscriptionPlanKey = "";
    user.weeklyCreditsBalance = 0;
    await user.save();
    return true;
  }

  return false;
};

const ensureWeeklyCredits = async (user) => {
  await ensureSubscriptionState(user);

  if (!isSubscriptionActive(user)) {
    return false;
  }

  const lastResetTime = user.weeklyCreditsResetAt ? new Date(user.weeklyCreditsResetAt).getTime() : 0;
  const shouldReset = !lastResetTime || Date.now() - lastResetTime >= WEEKLY_RESET_MS;

  if (!shouldReset) {
    return false;
  }

  user.weeklyCreditsBalance = WEEKLY_SUBSCRIPTION_CREDITS;
  user.weeklyCreditsResetAt = new Date();
  await user.save();
  return true;
};

const buildAccessState = (user) => ({
  subscription: {
    active: isSubscriptionActive(user),
    subscribed: Number(user.subscribed) === 1 ? 1 : 0,
    status: user.subscriptionStatus || "inactive",
    planKey: user.subscriptionPlanKey || "",
    planLabel: SUBSCRIPTION_PLANS[user.subscriptionPlanKey]?.label || "Free",
    weeklyCreditsBalance: user.weeklyCreditsBalance || 0,
    currentEnd: user.subscriptionCurrentEnd
  },
  credits: {
    purchased: user.purchasedCreditsBalance || 0,
    freeScraper: user.freeScraperCreditsRemaining || 0,
    freeAudit: user.freeAuditCreditsRemaining || 0
  },
  limits: {
    maxMessagesPerChat: isSubscriptionActive(user) ? PRO_CHAT_MESSAGE_LIMIT : FREE_CHAT_MESSAGE_LIMIT,
    maxImagesPerChat: isSubscriptionActive(user) ? PRO_CHAT_IMAGE_LIMIT : FREE_CHAT_IMAGE_LIMIT
  }
});

const activateSubscriptionForUser = async (user, planKey, paymentId = "") => {
  const plan = SUBSCRIPTION_PLANS[planKey];

  if (!plan) {
    throw new Error("Invalid subscription plan");
  }

  const baseTime = isSubscriptionActive(user) && user.subscriptionCurrentEnd
    ? new Date(user.subscriptionCurrentEnd).getTime()
    : Date.now();

  user.subscribed = 1;
  user.subscriptionStatus = "active";
  user.subscriptionPlanKey = planKey;
  user.subscriptionCurrentStart = new Date();
  user.subscriptionCurrentEnd = new Date(baseTime + plan.durationMs);
  user.weeklyCreditsBalance = WEEKLY_SUBSCRIPTION_CREDITS;
  user.weeklyCreditsResetAt = new Date();

  if (paymentId && !user.processedRazorpayPaymentIds.includes(paymentId)) {
    user.processedRazorpayPaymentIds.push(paymentId);
  }

  await user.save();
};

const addPurchasedCredits = async (user, credits) => {
  user.purchasedCreditsBalance += credits;
  await user.save();
};

const consumeToolCredit = async (user, toolKey) => {
  await ensureSubscriptionState(user);
  await ensureWeeklyCredits(user);

  if (isSubscriptionActive(user) && user.weeklyCreditsBalance > 0) {
    user.weeklyCreditsBalance -= 1;
    await user.save();
    return;
  }

  if (user.purchasedCreditsBalance > 0) {
    user.purchasedCreditsBalance -= 1;
    await user.save();
    return;
  }

  if (toolKey === "scraper" && user.freeScraperCreditsRemaining > 0) {
    user.freeScraperCreditsRemaining -= 1;
    await user.save();
    return;
  }

  if (toolKey === "audit" && user.freeAuditCreditsRemaining > 0) {
    user.freeAuditCreditsRemaining -= 1;
    await user.save();
    return;
  }

  throw new Error(`${toolKey === "scraper" ? "Scraper" : "Page audit"} limit reached. Buy credits or subscribe to continue.`);
};

const assertChatMessageLimit = (user, chat) => {
  if (!chat) {
    return;
  }

  const limit = isSubscriptionActive(user) ? PRO_CHAT_MESSAGE_LIMIT : FREE_CHAT_MESSAGE_LIMIT;

  if (chat.messages.length >= limit) {
    throw new Error(
      isSubscriptionActive(user)
        ? "This chat has reached the current message limit. Start a new chat to continue."
        : "Free plan chat limit reached for this thread. Start a new chat or subscribe to continue this thread."
    );
  }
};

const assertImageUploadLimit = (user, chat) => {
  const currentCount = chat?.imageUploadCount || 0;
  const limit = isSubscriptionActive(user) ? PRO_CHAT_IMAGE_LIMIT : FREE_CHAT_IMAGE_LIMIT;

  if (currentCount >= limit) {
    throw new Error(
      isSubscriptionActive(user)
        ? "Image upload limit reached for this chat. Start a new chat to continue."
        : "Free plan image upload limit reached for this chat. Start a new chat or subscribe to continue uploading in the same thread."
    );
  }
};

module.exports = {
  CREDIT_PACKS,
  FREE_CHAT_IMAGE_LIMIT,
  FREE_CHAT_MESSAGE_LIMIT,
  PRO_CHAT_IMAGE_LIMIT,
  PRO_CHAT_MESSAGE_LIMIT,
  SUBSCRIPTION_PLANS,
  WEEKLY_SUBSCRIPTION_CREDITS,
  activateSubscriptionForUser,
  addPurchasedCredits,
  assertChatMessageLimit,
  assertImageUploadLimit,
  buildAccessState,
  consumeToolCredit,
  ensureSubscriptionState,
  ensureWeeklyCredits,
  isSubscriptionActive
};
