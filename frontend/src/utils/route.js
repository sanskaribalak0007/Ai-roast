import { PUBLIC_HASH_ROUTES, WORKSPACE_ROUTES } from "../constants/routes";

const WORKSPACE_HASHES = new Set([
  WORKSPACE_ROUTES.BILLING,
  WORKSPACE_ROUTES.SCRAPER,
  WORKSPACE_ROUTES.AUDIT,
  WORKSPACE_ROUTES.PLAYGROUND
]);

export const readRoute = () => {
  const path = window.location.pathname;

  if (path.startsWith("/reset/")) {
    return {
      type: "reset",
      token: decodeURIComponent(path.replace("/reset/", ""))
    };
  }

  if (path.startsWith("/shared/")) {
    return {
      type: "shared",
      token: decodeURIComponent(path.replace("/shared/", ""))
    };
  }

  const hash = window.location.hash.replace("#", "");

  if (PUBLIC_HASH_ROUTES.includes(hash) || WORKSPACE_HASHES.has(hash)) {
    return { type: hash, token: "" };
  }

  return { type: WORKSPACE_ROUTES.CHAT, token: "" };
};
