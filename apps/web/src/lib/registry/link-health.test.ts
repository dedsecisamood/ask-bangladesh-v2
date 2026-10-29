// @vitest-environment node
import { expect, it } from "vitest";
import {
  analyseLinkObservation,
  liveLinkPolicy,
  type LinkObservation,
} from "./link-health";
const url = "https://registry.example.com/check/";
const observation: LinkObservation = {
  url,
  approvedUrls: [url],
  addresses: ["1.1.1.1"],
  peer: "1.1.1.1",
  tlsValid: true,
  status: 200,
  bytes: 0,
};
it("live networking stays disabled; offline success grants no verification", () => {
  expect(liveLinkPolicy.enabled).toBe(false);
  expect(analyseLinkObservation(observation)).toEqual({
    state: "healthy",
    reviewRequired: false,
    code: "OBSERVED",
  });
});
it.each([
  "http://registry.example.com/",
  "https://localhost/",
  "https://127.0.0.1/",
  "https://[::1]/",
  "https://2130706433/",
  "file:///private",
])("rejects unsafe or unapproved URL %s", (url) => {
  expect(analyseLinkObservation({ ...observation, url }).state).toBe(
    "verification_blocked",
  );
});
it.each([
  "127.0.0.1",
  "10.0.0.1",
  "169.254.169.254",
  "192.168.1.1",
  "172.16.0.1",
  "100.64.0.1",
  "0.0.0.0",
  "224.0.0.1",
  "198.18.0.1",
  "192.0.2.1",
  "::1",
  "fe80::1",
  "fc00::1",
  "::ffff:127.0.0.1",
  "2606:4700:4700::1111",
])("blocks private/reserved/unsupported address %s", (ip) => {
  expect(
    analyseLinkObservation({ ...observation, addresses: [ip], peer: ip }).code,
  ).toBe("UNSAFE_OR_UNPINNED_DNS");
});
it("rejects mixed public/private DNS and changed connected peer", () => {
  expect(
    analyseLinkObservation({
      ...observation,
      addresses: ["1.1.1.1", "10.0.0.1"],
    }).state,
  ).toBe("verification_blocked");
  expect(
    analyseLinkObservation({ ...observation, peer: "8.8.8.8" }).state,
  ).toBe("verification_blocked");
});
it("validates every redirect and keeps even approved moves under review", () => {
  expect(
    analyseLinkObservation({
      ...observation,
      redirects: ["https://127.0.0.1/"],
    }).state,
  ).toBe("verification_blocked");
  expect(
    analyseLinkObservation({ ...observation, redirects: Array(4).fill(url) })
      .code,
  ).toBe("REDIRECT_LIMIT");
  expect(
    analyseLinkObservation({ ...observation, redirects: [url] }).state,
  ).toBe("redirected");
});
it.each(["timeout", "dns", "connection", "tls"] as const)(
  "preserves transient %s failures without permanent deapproval",
  (error) => {
    expect(analyseLinkObservation({ ...observation, error }).state).toBe(
      "temporarily_unavailable",
    );
    expect(
      analyseLinkObservation({ ...observation, error, priorFailures: 2 }).state,
    ).toBe("suspected_broken");
  },
);
it("bounds response observations and TLS; never implies unrestricted GET fallback", () => {
  expect(analyseLinkObservation({ ...observation, bytes: 1025 }).code).toBe(
    "RESPONSE_LIMIT",
  );
  expect(analyseLinkObservation({ ...observation, tlsValid: false }).code).toBe(
    "TLS_NOT_VALIDATED",
  );
  expect(
    analyseLinkObservation({ ...observation, headUnsupported: true }).code,
  ).toBe("GET_NOT_PERMITTED");
  expect(
    analyseLinkObservation({
      ...observation,
      headUnsupported: true,
      getFallbackPermitted: true,
    }).state,
  ).toBe("healthy");
});
it.each([401, 403])("HTTP %s is restricted, not broken", (status) => {
  expect(analyseLinkObservation({ ...observation, status }).state).toBe(
    "manual_review_required",
  );
});
it.each([404, 410, 429, 500, 503])(
  "HTTP %s needs repeated failure or review",
  (status) => {
    expect(analyseLinkObservation({ ...observation, status }).state).toBe(
      "temporarily_unavailable",
    );
    expect(
      analyseLinkObservation({ ...observation, status, priorFailures: 2 })
        .reviewRequired,
    ).toBe(true);
  },
);
