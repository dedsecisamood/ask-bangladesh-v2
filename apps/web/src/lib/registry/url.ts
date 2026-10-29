import { isIP } from "node:net";
// Syntax/identity validation only. Never performs DNS or HTTP requests.
export function normalizeRegistryUrl(input: string): string {
  if (
    input.length > 2048 ||
    /[\u0000-\u0020\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\\]/u.test(
      input,
    )
  )
    throw new Error("Unsafe source URL.");
  const url = new URL(input);
  const authority = /^https:\/\/([^/?#]+)/iu.exec(input)?.[1];
  if (
    url.protocol !== "https:" ||
    !authority ||
    authority.includes("@") ||
    url.username ||
    url.password ||
    url.port ||
    isIP(url.hostname) ||
    url.hostname.includes(":") ||
    url.hostname.endsWith(".")
  )
    throw new Error("Unsafe source URL.");
  if (
    !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/u.test(
      url.hostname,
    ) ||
    url.hostname.length > 253 ||
    /(^|\.)(localhost|local|internal|invalid|test|example|localdomain)$/u.test(
      url.hostname,
    ) ||
    /(^|\.)home\.arpa$/u.test(url.hostname)
  )
    throw new Error("Unsafe source hostname.");
  const rawPath = input
    .slice(input.indexOf(authority) + authority.length)
    .split(/[?#]/u)[0];
  if (
    /%(?:2f|5c|00|0a|0d)/iu.test(input) ||
    /(?:^|\/)\.{1,2}(?:\/|$)/u.test(rawPath) ||
    /%2e/iu.test(rawPath)
  )
    throw new Error("Ambiguous source path.");
  for (const parameters of [
    url.searchParams,
    new URLSearchParams(url.hash.slice(1)),
  ])
    for (const name of parameters.keys())
      if (
        /^(password|access_token|refresh_token|api_key|apikey|session|session_id|nid|passport|token|key|secret|authorization|auth)$/iu.test(
          name,
        )
      )
        throw new Error("Sensitive URL parameters are not supported.");
  url.hash = "";
  return url.href;
}
