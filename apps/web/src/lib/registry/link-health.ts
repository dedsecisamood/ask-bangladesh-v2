import { isIP } from "node:net";
import { normalizeRegistryUrl } from "./url";
// Offline observations only. No resolver, socket, fetch, proxy or HTTP client.
export const liveLinkPolicy = {
  enabled: false,
  reason: "NETWORK_POLICY_NOT_READY",
} as const;
export interface LinkObservation {
  url: string;
  approvedUrls: readonly string[];
  addresses?: readonly string[];
  peer?: string;
  redirects?: readonly string[];
  tlsValid?: boolean;
  bytes?: number;
  status?: number;
  error?: "timeout" | "dns" | "connection" | "tls";
  priorFailures?: number;
  headUnsupported?: boolean;
  getFallbackPermitted?: boolean;
  captcha?: boolean;
}
function publicIPv4(ip: string) {
  if (isIP(ip) !== 4) return false; // IPv6 remains blocked until the worker has tested IP pinning.
  const [a, b, c] = ip.split(".").map(Number);
  return !(
    a === 0 ||
    a === 10 ||
    a === 127 ||
    a >= 224 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 &&
      (b === 168 || b === 0 || b === 2 || (b === 88 && c === 99))) ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100))) ||
    (a === 203 && b === 0 && c === 113)
  );
}
export function analyseLinkObservation(o: LinkObservation) {
  const blocked = (code: string) => ({
    state: "verification_blocked",
    reviewRequired: true,
    code,
  });
  const urls = [o.url, ...(o.redirects ?? [])];
  if (urls.length > 4) return blocked("REDIRECT_LIMIT");
  try {
    for (const url of urls)
      if (normalizeRegistryUrl(url) !== url || !o.approvedUrls.includes(url))
        return blocked("UNAPPROVED_DESTINATION");
  } catch {
    return blocked("UNSAFE_URL");
  }
  if (o.addresses?.some((ip) => !publicIPv4(ip)))
    return blocked("UNSAFE_OR_UNPINNED_DNS");
  if ((o.bytes ?? 0) > 1024) return blocked("RESPONSE_LIMIT");
  if (o.error) {
    const n = (o.priorFailures ?? 0) + 1;
    return {
      state: n >= 3 ? "suspected_broken" : "temporarily_unavailable",
      reviewRequired: n >= 3,
      code: o.error.toUpperCase(),
    };
  }
  if (!o.addresses?.length || !o.peer || !o.addresses.includes(o.peer))
    return blocked("UNSAFE_OR_UNPINNED_DNS");
  if (o.tlsValid !== true) return blocked("TLS_NOT_VALIDATED");
  if (o.headUnsupported && !o.getFallbackPermitted)
    return blocked("GET_NOT_PERMITTED");
  if (o.captcha || o.status === 401 || o.status === 403)
    return {
      state: "manual_review_required",
      reviewRequired: true,
      code: "ACCESS_RESTRICTED",
    };
  if (o.status && o.status >= 200 && o.status < 300)
    return {
      state: urls.length > 1 ? "redirected" : "healthy",
      reviewRequired: urls.length > 1,
      code: "OBSERVED",
    };
  if (o.status && o.status >= 300 && o.status < 400)
    return {
      state: "manual_review_required",
      reviewRequired: true,
      code: "REDIRECT_REQUIRES_REVIEW",
    };
  const n = (o.priorFailures ?? 0) + 1;
  return {
    state: n >= 3 ? "suspected_broken" : "temporarily_unavailable",
    reviewRequired: n >= 3,
    code: "HTTP_FAILURE",
  };
}
