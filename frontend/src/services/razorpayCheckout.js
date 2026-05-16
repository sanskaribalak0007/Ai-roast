import { appConfig } from "../config/app.config";

const SCRIPT_ID = "razorpay-checkout-js";
const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const LOAD_TIMEOUT_MS = 20000;

const resolveRazorpayConstructor = () => {
  if (typeof window !== "undefined" && window.Razorpay) {
    return window.Razorpay;
  }

  return null;
};

/**
 * Loads Razorpay checkout.js once and returns the Razorpay constructor.
 */
export const loadRazorpayCheckout = () =>
  new Promise((resolve, reject) => {
    const existingConstructor = resolveRazorpayConstructor();

    if (existingConstructor) {
      resolve(existingConstructor);
      return;
    }

    let settled = false;
    const finish = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      window.clearTimeout(timeoutId);
      callback();
    };

    const onReady = () => {
      const Razorpay = resolveRazorpayConstructor();

      if (Razorpay) {
        finish(() => resolve(Razorpay));
        return;
      }

      finish(() => reject(new Error("Razorpay failed to initialize.")));
    };

    const onError = () => finish(() => reject(new Error("Unable to load Razorpay checkout. Disable ad blockers and retry.")));

    const existingScript =
      document.getElementById(SCRIPT_ID) ||
      document.querySelector('script[data-razorpay="checkout"]') ||
      document.querySelector(`script[src="${SCRIPT_SRC}"]`);

    if (existingScript) {
      if (existingScript.getAttribute("data-loaded") === "true" || resolveRazorpayConstructor()) {
        onReady();
        return;
      }

      existingScript.addEventListener("load", onReady, { once: true });
      existingScript.addEventListener("error", onError, { once: true });
    } else {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.dataset.razorpay = "checkout";
      script.addEventListener(
        "load",
        () => {
          script.setAttribute("data-loaded", "true");
          onReady();
        },
        { once: true }
      );
      script.addEventListener("error", onError, { once: true });
      document.head.appendChild(script);
    }

    const timeoutId = window.setTimeout(() => {
      if (!resolveRazorpayConstructor()) {
        finish(() => reject(new Error("Razorpay checkout timed out. Check your internet connection.")));
      }
    }, LOAD_TIMEOUT_MS);
  });

/**
 * Opens Razorpay checkout modal for a server-created order.
 */
export const openRazorpayCheckout = async ({
  key,
  orderId,
  amount,
  currency,
  description,
  customerEmail,
  onSuccess,
  onDismiss
}) => {
  const Razorpay = await loadRazorpayCheckout();

  if (!key) {
    throw new Error("Razorpay key is missing. Add RAZORPAY_KEY_ID in backend .env and restart the server.");
  }

  if (!orderId || amount == null || !currency) {
    throw new Error("Incomplete payment details from server. Refresh the page and try again.");
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    let modalOpened = false;

    const finish = (callback) => {
      if (settled) {
        return;
      }

      settled = true;
      callback();
    };

    const checkout = new Razorpay({
      key,
      order_id: orderId,
      amount: Number(amount),
      currency,
      name: appConfig.name,
      description,
      prefill: customerEmail ? { email: customerEmail } : undefined,
      handler: async (response) => {
        try {
          const result = await onSuccess(response);
          finish(() => resolve(result));
        } catch (error) {
          finish(() => reject(error));
        }
      },
      modal: {
        ondismiss: () => {
          onDismiss?.();

          if (!modalOpened) {
            finish(() =>
              reject(
                new Error(
                  "Payment gateway did not open. Confirm Razorpay test keys in backend .env and restart the API server."
                )
              )
            );
            return;
          }

          finish(() => reject(new Error("PAYMENT_CANCELLED")));
        },
        escape: true,
        confirm_close: true
      },
      theme: {
        color: appConfig.razorpayThemeColor
      }
    });

    checkout.on("payment.failed", (response) => {
      const reason =
        response?.error?.description ||
        response?.error?.reason ||
        "Payment failed. Please try again.";
      finish(() => reject(new Error(reason)));
    });

    try {
      checkout.open();
      modalOpened = true;
    } catch (error) {
      finish(() => reject(new Error(error?.message || "Unable to open Razorpay checkout.")));
    }
  });
};

/** Preload checkout script (call on billing page mount). */
export const preloadRazorpayCheckout = () => {
  loadRazorpayCheckout().catch(() => {
    // Billing page shows configuration errors when user clicks Pay.
  });
};
