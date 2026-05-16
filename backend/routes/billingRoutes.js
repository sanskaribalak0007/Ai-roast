const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const {
  getBillingConfig,
  createSubscriptionCheckout,
  verifySubscriptionCheckout,
  createCreditsOrder,
  verifyCreditsOrder
} = require("../controllers/billingController");

const router = express.Router();

router.get("/config", authMiddleware, getBillingConfig);
router.post("/subscription/create", authMiddleware, createSubscriptionCheckout);
router.post("/subscription/verify", authMiddleware, verifySubscriptionCheckout);
router.post("/credits/create-order", authMiddleware, createCreditsOrder);
router.post("/credits/verify", authMiddleware, verifyCreditsOrder);

module.exports = router;
