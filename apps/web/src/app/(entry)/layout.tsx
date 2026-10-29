import type { ReactNode } from "react";
import { siteMetadata } from "@/lib/site-metadata";
import { banglaFont, latinFont } from "@/styles/fonts";
import "@/styles/globals.css";

export const metadata = siteMetadata("bn");
export default function EntryLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="bn"
      dir="ltr"
      className={`${banglaFont.variable} ${latinFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
