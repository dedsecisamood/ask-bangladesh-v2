# Ask Bangladesh self-hosted fonts

P42 retains the same font files, preload configuration and 240 KiB budget.
Nirmala UI/Vrinda are named as system Bengali fallbacks after the existing serif
faces; no new font asset or runtime download is introduced. Local browser tests
also block WOFF2 loading and check usable Bangla controls. Representative agent
visual inspection does not replace real-device or independent reader review.
See [P42_REPORT](P42_REPORT.md).

## Current screenshot refresh

The owner-requested serif presentation replaces the active Bangla face with
[Noto Serif Bengali](../apps/web/src/styles/fonts/noto-serif-bengali-bengali-wght-normal.woff2),
191,284 bytes, Google Fonts v31, variable normal weight 100-900. Its SHA-256 is
`8ae8a8ce3e7a0c1511b418919f49afc7f28532286acb57cd4158d245754d0170`.
The unmodified [original OFL](../apps/web/src/styles/fonts/OFL-NotoSerifBengali.txt)
is preserved (Copyright 2022 The Noto Project Authors).

The [official stylesheet](https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@100..900&display=swap),
[exact WOFF2](https://fonts.gstatic.com/s/notoserifbengali/v31/hYkhPvggTvnzO14VSXltirUdnnkt1pwmWrprmO7RjE0a5BtdKyg8JCJZ.woff2)
and [license](https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifbengali/OFL.txt)
were actually retrieved on 2026-10-22. English presentation uses system Times New
Roman/Georgia, with local Bengali fallback. Inter remains available for compact UI.
The two active preloaded assets total **239,540 bytes / 233.93 KiB**; a 240 KiB font
budget supersedes the provisional P08 160 KiB target for this authorized design.
Old Sans Bengali assets/licenses are retained as history but are not loaded.
All fonts remain local at runtime. See [FRONTEND_REFRESH_REPORT](FRONTEND_REFRESH_REPORT.md).

## Historical P08 selection

P08 font selection and loader configuration, checked 2026-10-19 (Asia/Dhaka).
The P08 application included two unmodified WOFF2 assets selected from pinned
Fontsource variable-font archives. Fontsource packages are asset sources only;
they are not added as application dependencies. Builds use local files through
[`next/font/local`](https://nextjs.org/docs/app/api-reference/components/font#local-fonts).
No font CDN or Google Fonts request is needed at build or page-render time.

## Selected faces and provenance

| UI role | Binary asset | Fontsource package | Source metadata revision | Embedded font version | Bytes |
| --- | --- | --- | --- | --- | ---: |
| Bangla text and digits | [noto-sans-bengali-bengali-wght-normal.woff2](../apps/web/src/styles/fonts/noto-sans-bengali-bengali-wght-normal.woff2) | `@fontsource-variable/noto-sans-bengali@5.3.0` | Google Fonts `v33`; metadata last modified `2026-01-28` | `Version 3.011` | 107,720 |
| English and complementary Latin text | [inter-latin-wght-normal.woff2](../apps/web/src/styles/fonts/inter-latin-wght-normal.woff2) | `@fontsource-variable/inter@5.3.0` | Google Fonts `v20`; metadata last modified `2025-09-10` | `Version 4.001;git-66647c0bb` | 48,256 |

The two files total **155,976 bytes (152.32 KiB)**. This is their on-disk WOFF2
payload, not an observed page-transfer total; it excludes CSS, JavaScript, HTTP
headers and other assets. Both selected files expose only a `wght` axis from 100
to 900, with default 400, and normal style. Width, optical-size, italic and other
language-subset files were not copied. Supporting additional scripts or genuine
italic faces needs a separate measured decision.

Downloaded sources and attribution references:

- [Noto Sans Bengali at Fontsource](https://fontsource.org/fonts/noto-sans-bengali)
  and the [pinned npm archive](https://registry.npmjs.org/@fontsource-variable/noto-sans-bengali/-/noto-sans-bengali-5.3.0.tgz).
  Its upstream is the [Noto Bengali project](https://github.com/notofonts/bengali),
  identified in the bundled copyright and Fontsource metadata.
- [Inter at Fontsource](https://fontsource.org/fonts/inter) and the
  [pinned npm archive](https://registry.npmjs.org/@fontsource-variable/inter/-/inter-5.3.0.tgz).
  Its upstream is the [Inter project](https://github.com/rsms/inter), identified in
  the bundled copyright and Fontsource metadata.
- Both archives identify [Google Fonts](https://github.com/google/fonts) as their
  upstream distribution source and Fontsource's
  [font-files repository](https://github.com/fontsource/font-files) as their
  packaging repository. These upstream links are attribution references and were
  not separately inspected; asset/version checks used the downloaded archives
  and their metadata. The Fontsource pages and pinned archives were accessed.

The pinned archives were downloaded using `npm pack --ignore-scripts`; only the
two selected font members and each archive's original `LICENSE` member were
copied into source. Extraction read exact member names rather than extracting
the full archive. The root package manifest and lockfile were not changed by
this asset selection.

## Licensing and attribution

Both fonts use the [SIL Open Font License 1.1](https://openfontlicense.org/).
The original copyright and complete license texts are preserved byte-for-byte:

- [OFL-NotoSansBengali.txt](../apps/web/src/styles/fonts/OFL-NotoSansBengali.txt):
  Copyright 2025 The Noto Project Authors.
- [OFL-Inter.txt](../apps/web/src/styles/fonts/OFL-Inter.txt):
  Copyright 2016 The Inter Project Authors. The original package's copyright line
  also names its italic upstream file; that notice is retained unaltered even
  though this application ships only the normal Latin subset.

Retain these notices and licenses when redistributing the font assets. The font
files were not edited, renamed internally or subsetted further in this project.
Changes to the fonts require checking the OFL conditions, including any reserved
font-name rules. Their license does not imply government or font-author endorsement
of Ask Bangladesh.

## Loader and CSS contract

[`fonts.ts`](../apps/web/src/styles/fonts.ts) exports `banglaFont` and `latinFont`.
Apply both exported `.variable` classes to the locale root, then select the stack
through CSS:

```css
html {
  font-family: var(--font-bangla), var(--font-latin), system-ui, sans-serif;
}

:lang(en) {
  font-family: var(--font-latin), var(--font-bangla), system-ui, sans-serif;
}
```

Both loaders use weight `100 900`, normal style, `display: "swap"` and explicit
preloading. The `unicode-range` descriptors match the selected archive CSS.
The Bengali subset excludes Latin letters; the complementary Inter subset handles
those letters. Characters outside both ranges fall through to the explicit system
stack. The Noto subset includes Bengali digits; preserve Unicode text and avoid
letter-spacing transforms that break conjunct shaping.

`adjustFontFallback: false` prevents Next.js from placing an automatically
generated Arial fallback inside either CSS variable ahead of the complementary
font. The application supplies its own fallback stack. `swap` keeps text available
while local fonts load, and preloads reduce discovery delay; this does not establish
zero layout shift or legibility on every device. Preloading both files reserves
the full 152.32 KiB font payload even on a primarily English page.

The installed Next.js 16.4.2
`dist/docs/01-app/03-api-reference/02-components/font.md` and the official
[font API reference](https://nextjs.org/docs/app/api-reference/components/font)
were read for relative paths, variable weights, preloading, CSS variables,
Unicode-range declarations and local fallback behavior.

## Integrity and completed asset checks

SHA-256 values of the repository asset bytes:

| File | SHA-256 |
| --- | --- |
| Noto Bengali WOFF2 | `4ccdc6269af7581727fc3eea491831bda1962c1baaca7f2c0dec054bfddde478` |
| Inter Latin WOFF2 | `3100e775e8616cd2611beecfa23a4263d7037586789b43f035236a2e6fbd4c62` |
| Noto OFL text | `c0d17a4a6f928d78749dbebfa9d2953b6086c2a1f64cdd1e450cc77fb8199b32` |
| Inter OFL text | `3b0a5fca3d17942cde889069889dedbbbd075e9b599968c82a95f4d944e9b345` |

Registry-reported archive integrity was checked against the downloaded archives:

```text
@fontsource-variable/noto-sans-bengali@5.3.0
sha512-035m0mzOcsVC1GHFH1ioeXjIFqVhuflGvnn8Xvr6esaZlGErNe1d+Jx2sEN/2WGPhjrT+5wwKPPSO8rbBeQo3w==

@fontsource-variable/inter@5.3.0
sha512-OupL48va4JNofb97w6NYeF9S7W/kHNKM0Er8Dem5nqi4jeOLrVJDoE8tZEpnMJmtkvNbB1EIPPwHcdkF6b1oUA==
```

Completed checks: pinned package versions and archive metadata; original license
retention; `wOF2` signatures and header lengths; byte sizes and SHA-256 digests;
and actual font parsing with the fontkit implementation already bundled in Next.js.
The parsed fonts reported the versions and weight axes in the table. Noto's
selected file has glyphs for Bengali `ক` and `০` and lacks Latin `A`; Inter has
Latin `A` and lacks those Bengali glyphs. This verifies those sampled glyphs,
not the full Bengali shaping repertoire.

Asset checks do not establish browser rendering, conjunct quality, punctuation
fallback, clipping, font transfer time or assistive-technology pronunciation.
Actual P08 browser and layout evidence belongs in
[CODEX_PROGRESS](CODEX_PROGRESS.md). Fluent Bangla review and representative
low-end-device/network checks remain necessary before broader release.
