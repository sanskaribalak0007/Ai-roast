const { normalizeOrigin } = require("../config/env");

const NETLIFY_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+\.netlify\.app$/i;

/**
 * Returns true when the request Origin is allowed for credentialed API access.
 */
const isOriginAllowed = (origin, env) => {
  if (!origin) {
    return !env.isProduction;
  }

  const normalized = normalizeOrigin(origin);

  if (env.corsOrigins.includes(normalized) || env.corsOrigins.includes(origin)) {
    return true;
  }

  if (env.allowNetlifyPreviews && NETLIFY_PREVIEW_PATTERN.test(normalized)) {
    return true;
  }

  return false;
};

module.exports = {
  isOriginAllowed,
  NETLIFY_PREVIEW_PATTERN
};
