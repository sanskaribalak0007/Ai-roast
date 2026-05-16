import { useEffect, useState } from "react";
import { appConfig } from "../config/app.config";
import { openRazorpayCheckout, preloadRazorpayCheckout } from "../services/razorpayCheckout";

function BillingPage({ api, onRefreshSession, sessionUser }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await api.getBillingConfig();
      setConfig(data);
      setError("");
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    preloadRazorpayCheckout();
  }, []);

  const afterBillingUpdate = async (message) => {
    setNotice(message);
    setActionLoading("");
    await loadConfig();

    if (onRefreshSession) {
      await onRefreshSession();
    }
  };

  const handlePaymentError = (requestError) => {
    if (requestError.message === "PAYMENT_CANCELLED") {
      setActionLoading("");
      return;
    }

    setError(requestError.message);
    setActionLoading("");
  };

  const startCheckout = async ({ planKey, packKey, description, verify }) => {
    if (!config?.payments?.enabled) {
      setError("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env, then restart the server.");
      return;
    }

    const loadingKey = planKey || packKey;

    try {
      setActionLoading(loadingKey);
      setError("");
      setNotice("Opening Razorpay checkout...");

      const order = planKey
        ? await api.createSubscriptionCheckout(planKey)
        : await api.createCreditsOrder(packKey);

      setNotice("");

      const result = await openRazorpayCheckout({
        key: order.key || config.razorpayKeyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        description,
        customerEmail: sessionUser?.email,
        onDismiss: () => setActionLoading(""),
        onSuccess: (response) => verify(response)
      });

      await afterBillingUpdate(result.message);
    } catch (requestError) {
      handlePaymentError(requestError);
    }
  };

  const handleSubscribe = (planKey) => {
    const plan = config?.plans?.[planKey] || Object.values(config?.plans || {}).find((item) => item.key === planKey);

    startCheckout({
      planKey,
      description: plan?.label || "Subscription",
      verify: (response) =>
        api.verifySubscriptionCheckout({
          ...response,
          planKey
        })
    });
  };

  const handleBuyCredits = (packKey) => {
    const pack = config?.creditPacks?.find((item) => item.key === packKey);

    startCheckout({
      packKey,
      description: pack ? `${pack.credits} credits` : "Credit pack",
      verify: (response) =>
        api.verifyCreditsOrder({
          ...response,
          packKey
        })
    });
  };

  if (loading) {
    return (
      <section className="tool-page">
        <p className="empty-copy">Loading billing...</p>
      </section>
    );
  }

  const access = config?.access;
  const plans = Object.values(config?.plans || {});
  const paymentsEnabled = config?.payments?.enabled;
  const isTestMode = config?.payments?.mode === "test";

  return (
    <section className="tool-page">
      <div className="section-head">
        <p className="eyebrow">Billing</p>
        <h2>Subscriptions, credit packs, and usage limits</h2>
        <p className="hero-copy">Pay securely with Razorpay. Checkout opens as a popup on this page.</p>
      </div>

      {paymentsEnabled ? (
        <div className={`billing-gateway-banner ${isTestMode ? "test" : "live"}`}>
          <strong>{isTestMode ? "Razorpay test mode active" : "Razorpay live mode"}</strong>
          <p>
            {isTestMode
              ? "Use test card 4111 1111 1111 1111, any future expiry, and any CVV. UPI and wallets also work in test mode."
              : "Real payments will be charged. Use test keys (rzp_test_...) for development."}
          </p>
        </div>
      ) : (
        <div className="billing-gateway-banner disabled">
          <strong>Payment gateway not configured</strong>
          <p>Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to backend/.env, then restart the backend server.</p>
        </div>
      )}

      {error ? <p className="notice error billing-error">{error}</p> : null}
      {notice ? <p className="notice success">{notice}</p> : null}

      <div className="audit-metric-grid billing-grid">
        <article className="audit-metric-card">
          <strong>{access?.subscription?.active ? "Subscribed" : "Free"}</strong>
          <span>Current plan</span>
        </article>
        <article className="audit-metric-card">
          <strong>{access?.subscription?.weeklyCreditsBalance || 0}</strong>
          <span>Weekly credits</span>
        </article>
        <article className="audit-metric-card">
          <strong>{access?.credits?.purchased || 0}</strong>
          <span>Purchased credits</span>
        </article>
        <article className="audit-metric-card">
          <strong>{access?.credits?.freeScraper || 0}</strong>
          <span>Free scraper credits</span>
        </article>
        <article className="audit-metric-card">
          <strong>{access?.credits?.freeAudit || 0}</strong>
          <span>Free audit credits</span>
        </article>
        <article className="audit-metric-card">
          <strong>{access?.limits?.maxImagesPerChat || 0}</strong>
          <span>Images per chat</span>
        </article>
      </div>

      <div className="billing-section">
        <h3>Subscription plans</h3>
        <div className="billing-pack-grid">
          {plans.map((plan) => (
            <article className="billing-pack-card billing-pack-card--featured" key={plan.key}>
              <strong>{plan.label}</strong>
              <span>
                {appConfig.currencySymbol} {plan.amount}
              </span>
              <p>50 weekly credits, longer chats, and more images per conversation.</p>
              <button
                className="primary-button"
                disabled={Boolean(actionLoading) || !paymentsEnabled}
                onClick={() => handleSubscribe(plan.key)}
                type="button"
              >
                {actionLoading === plan.key ? "Opening checkout..." : "Pay"}
              </button>
            </article>
          ))}
        </div>
      </div>

      <div className="billing-section">
        <h3>Credit packs</h3>
        <div className="billing-pack-grid">
          {config?.creditPacks?.map((pack) => (
            <article className="billing-pack-card" key={pack.key}>
              <strong>{pack.credits} credits</strong>
              <span>
                {appConfig.currencySymbol} {pack.amount}
              </span>
              <button
                className="ghost-button"
                disabled={Boolean(actionLoading) || !paymentsEnabled}
                onClick={() => handleBuyCredits(pack.key)}
                type="button"
              >
                {actionLoading === pack.key ? "Opening checkout..." : "Buy credits"}
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default BillingPage;
