import {
  Activity,
  Database,
  ShieldCheck,
  FileCheck,
  CircleCheck,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";

// Deliberately not telemetry. Live metrics require an authorized data integration.
export function ProjectStatus({ locale }: { locale: Locale }) {
  const bn = locale === "bn";
  const metrics = bn
    ? [
        "অনুমোদিত সোর্স",
        "ইনজেস্টেড অনুচ্ছেদ",
        "গ্রাউন্ডেড নির্ভুলতা",
        "নিষ্পন্ন সংশোধন",
      ]
    : [
        "Approved sources",
        "Ingested passages",
        "Grounded accuracy",
        "Resolved reports",
      ];
  return (
    <section
      className="project-status"
      aria-labelledby="project-status-heading"
    >
      <div className="status-heading-row">
        <h1 id="project-status-heading">
          <Activity aria-hidden="true" />
          {bn
            ? "সিস্টেম অপারেশন ও তথ্য যাচাইকরণ মেট্রিক্স"
            : "System operations & information verification"}
        </h1>
        <p>
          {bn
            ? "উন্নয়নের অবস্থা · লাইভ মেট্রিক্স নয়"
            : "Development status · Not live telemetry"}
        </p>
      </div>
      <div className="project-metrics">
        {metrics.map((label, index) => (
          <div className="project-metric" key={label}>
            <h2>{label}</h2>
            <p
              className="metric-value"
              aria-label={bn ? "তথ্য উপলব্ধ নয়" : "Data unavailable"}
            >
              —
            </p>
            <p className="metric-note">
              {index < 2
                ? bn
                  ? "লাইভ ডেটা সংযুক্ত নয়"
                  : "Live data not connected"
                : bn
                  ? "এখনো পরিমাপ করা হয়নি"
                  : "Not yet measured"}
            </p>
          </div>
        ))}
      </div>
      <div className="project-status-panels">
        <section className="project-status-panel">
          <h2>
            <Database aria-hidden="true" />
            {bn
              ? "সরকারি সোর্স ফ্রেশনেস মনিটর"
              : "Government-source freshness monitor"}
          </h2>
          <div className="monitor-rows">
            {(bn
              ? [
                  "অফিসিয়াল উৎসের পর্যালোচনা",
                  "উৎসের হালনাগাদ পরীক্ষা",
                  "বিরোধপূর্ণ তথ্য পর্যালোচনা",
                ]
              : [
                  "Official-source review",
                  "Source freshness checks",
                  "Conflicting-source review",
                ]
            ).map((label) => (
              <div className="monitor-row" key={label}>
                <div>
                  <h3>{label}</h3>
                  <p>
                    {bn
                      ? "বাস্তব উৎসের তথ্য এখনো প্রকাশিত নয়"
                      : "Real-source status is not published yet"}
                  </p>
                </div>
                <span className="monitor-state">
                  {bn ? "অপেক্ষমাণ" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </section>
        <section className="project-status-panel">
          <h2>
            <FileCheck aria-hidden="true" />
            {bn ? "নিরাপত্তা ও গোপনীয়তা" : "Security & privacy commitments"}
          </h2>
          <div className="monitor-rows">
            <div className="security-note security-note-primary">
              <h3>
                <CircleCheck aria-hidden="true" />
                {bn
                  ? "গোপনীয়তাকে প্রাধান্য দেওয়া ডেমো"
                  : "A privacy-first demonstration"}
              </h3>
              <p>
                {bn
                  ? "এই ডেমোতে প্রশ্ন শুধু খোলা পৃষ্ঠার মেমরিতে থাকে। এনআইডি, পাসপোর্ট নম্বর বা অন্য ব্যক্তিগত তথ্য দেবেন না।"
                  : "Demo questions stay in the open page’s memory. Do not enter NID or passport numbers, or other personal information."}
              </p>
            </div>
            <div className="security-note">
              <h3>
                <ShieldCheck aria-hidden="true" />
                {bn
                  ? "প্রমাণ ও নির্দেশনার সীমারেখা"
                  : "Evidence and instruction boundaries"}
              </h3>
              <p>
                {bn
                  ? "সরকারি নথি তথ্যের উৎস হবে, নির্দেশনা নয়। লাইভ এআই উত্তর এখনো যুক্ত নয়; নিরাপত্তার পূর্ণ নিশ্চয়তা দাবি করা হচ্ছে না।"
                  : "Retrieved documents must be evidence, never instructions. Live AI answers are not connected; no absolute security guarantee is claimed."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
