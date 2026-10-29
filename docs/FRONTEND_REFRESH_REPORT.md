# Screenshot frontend refresh

Owner-authorized frontend work, begun 2026-10-22. Reference evidence is the three
supplied screenshots; the reference website itself was not accessed.

The shared header, centered serif homepage, large question bar, four outlined
navigation cards, white/navy/emerald themes and About status panels now follow the
reference's visual hierarchy. Mobile navigation, language switching, the demo
question handoff, directory/policy routes and independent disclosure are preserved.
A guide index links to existing preparation templates. No official procedures,
coverage figures, source approvals, AI accuracy or absolute security guarantees
were copied from the screenshot. Unconnected metrics show unavailable states.

Light/dark mode follows the system until an explicit choice is stored as the
enum-only `askbd-theme` preference. A trusted static prepaint script restores it;
blocked storage still permits toggling. No citizen question is added to storage.
The staff authentication CSP and backend routes are unchanged.

Changed presentation files: shared header/navigation/brand/theme, homepage,
compact question composer, guide index/route contract, About/status panels,
locale/product copy, fonts, global styles and related tests. A licensed Bengali
serif asset is self-hosted; no new UI runtime dependency was added.

Verification executed:

- `npm.cmd run test:e2e -- --workers=2`: **31 passed**, including existing journeys,
  both locales, six widths, 200% text resize, 400%-equivalent reflow, keyboard focus,
  axe scans, no-JavaScript reading, no private request/persistence and local assets.
- New browser cases cover both palettes, persisted theme, blocked storage/system
  preference, About's honest metric states and mobile About/guide reflow.
- Screenshots were actually captured and visually inspected: English light,
  Bangla dark, Bangla About light and mobile layout. Files are under ignored
  `.cache/frontend-refresh`. This is a close visual implementation, not a claim
  of pixel identity or full human/device/screen-reader accessibility conformance.
- Initial browser failures identified mismatched visible/accessibility labels,
  enlarged-text navigation overflow and an old two-rendered-font assumption.
  Labels, container-responsive navigation and the system-serif font assertion were
  corrected; the complete browser suite then passed.
- Both palettes pass 30 automated text/control token contrast checks. The first
  production build, strict types and lint passed; final combined Phase 6 checks
  are recorded in [PHASE_6_REPORT](PHASE_6_REPORT.md).

Measured cold mobile run: 225,485 encoded HTML/CSS/JS bytes; 239,540 font bytes,
two local font requests, 4,560.5 ms load under the configured 150 ms / 1.6 Mbps /
4x CPU lab profile. This is one observation, not a field percentile or release gate.
See [FONTS](FONTS.md) and [DESIGN_SYSTEM](DESIGN_SYSTEM.md).

Frontend acceptance: **PASS locally**. No deployment, commit or push.
