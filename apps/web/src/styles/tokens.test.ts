import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("apps/web/src/styles/globals.css", "utf8");
const light = css.slice(
  css.indexOf(":root {"),
  css.indexOf(":root[data-theme"),
);
const dark = css.slice(
  css.indexOf(':root[data-theme="dark"]'),
  css.indexOf("@media"),
);
function luminance(token: string, palette: string) {
  const hex = new RegExp(`--${token}:\\s*(#[0-9a-f]{6})`, "i").exec(
    palette,
  )?.[1];
  if (!hex) throw new Error(`Missing color token: ${token}`);
  const rgb = [1, 3, 5]
    .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(a: string, b: string, palette: string) {
  const levels = [luminance(a, palette), luminance(b, palette)].sort(
    (x, y) => y - x,
  );
  return (levels[0] + 0.05) / (levels[1] + 0.05);
}
describe.each([
  ["light", light],
  ["dark", dark],
])("%s-mode contrast", (_name, palette) => {
  it.each([
    ["foreground", "background"],
    ["card-foreground", "card"],
    ["muted-foreground", "background"],
    ["muted-foreground", "card"],
    ["muted-foreground", "secondary"],
    ["primary", "background"],
    ["primary-foreground", "primary"],
    ["secondary-foreground", "secondary"],
    ["accent-foreground", "accent"],
    ["destructive-foreground", "destructive"],
    ["warning", "warning-background"],
  ])("keeps normal text %s on %s at AA contrast", (foreground, background) => {
    expect(contrast(foreground, background, palette)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
  it.each([
    ["input", "background"],
    ["input", "card"],
    ["ring", "background"],
    ["ring", "card"],
  ])("keeps %s distinguishable on %s", (foreground, background) => {
    expect(contrast(foreground, background, palette)).toBeGreaterThanOrEqual(3);
  });
});
