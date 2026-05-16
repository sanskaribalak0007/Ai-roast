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
      setLoadi