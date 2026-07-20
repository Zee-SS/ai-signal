# AI Signal Design System

## Intent

AI Signal uses a white-first, light-green visual system called “fresh signal.” It is designed for a five-minute scan on a 1920x1080 monitor and retains the same hierarchy at 390px. Source-backed measurements and motion are the visual material; decorative imagery is unnecessary.

## Theme

The product is light-only. Most of the page is neutral white with soft leaf-green fields, near-black green ink, restrained rules, and a single stronger green for interaction and data emphasis.

## Colour

All implementation colours are declared as OKLCH custom properties.

- Paper: `oklch(0.992 0.006 145)`
- Soft field: `oklch(0.973 0.022 145)`
- Signal field: `oklch(0.93 0.065 145)`
- Ink: `oklch(0.18 0.018 145)`
- Secondary ink: `oklch(0.39 0.02 145)`
- Rule: `oklch(0.87 0.025 145)`
- Leaf accent: `oklch(0.72 0.17 145)`
- Interactive green: `oklch(0.43 0.15 145)`
- Warning and error states always pair colour with text or an icon.

## Typography

Use Bricolage Grotesque Variable for the wordmark, primary statement, and large measured values. Use Geist Variable for all interface and body copy, with Geist Mono for dates, versions, prices, and tabular figures. The scale stays compact: 40px maximum statement, 24–28px sections, 17–20px records, 15–16px body, and 12–14px metadata.

## Layout

- Hallmark macrostructure: Map / Diagram, organized around the model trade-off field.
- Maximum width: 1440px with fluid 16–40px gutters.
- At 1440px and typical 1080p windows, the first viewport contains the daily pulse and most of the model map.
- At 1024px, paired lanes stack while visual comparisons remain intact.
- At 768px and below, charts gain labelled companion lists and sections become a single flow.
- At 390px, the model map becomes a ranked visual list, controls remain 44px, and no content overflows horizontally.
- Root overflow is clipped, never hidden, to preserve sticky behavior.

## Components

- Header: Hallmark N10, one DOM structure with a constant outer slot. It begins as a quiet full-width navigation row and morphs, after an IntersectionObserver sentinel, into a centered rounded sticky island.
- Signal mark: three offset radio arcs and a dot, drawn as a native SVG.
- Model map: accessible SVG scatterplot with quality on the vertical axis, selectable speed or cost on the horizontal axis, explicit source notes, and a mobile list fallback.
- Tool lanes: local/CLI and browser/cloud surfaces are visually separated before ranking.
- Momentum: compact bars use live GitHub repository metadata as community-interest and maintenance signals, never as product-quality proof.
- Cards: only for independent summary decisions. Ordinary records use space, type, and rules.
- Footer: Hallmark Ft2 compact source line and methodology disclosure.

## Motion

Motion intensity is 7/10 but displacement remains small. Major sections reveal with 30–60ms stagger, 8–12px travel, and a 220–360ms ease-out. Buttons press to 0.97 and release with one restrained overshoot curve. Chart marks ink on when first visible. Header morph and view switching clarify state. Motion never delays access to information, and `prefers-reduced-motion` removes transforms and staggering.

## States

Every data surface defines matched loading skeletons, informative empty states, contextual errors, stale-cache messaging, development-fixture labels, and partial-source-failure notices. Interactive controls cover default, hover, focus, active, disabled, and loading states.

## Voice

Use compact, factual labels: “Quality leader,” “Fastest cohort,” “Local / terminal,” “Browser / cloud,” “Measured 20 Jul 2026,” and “No verified releases.” Avoid slogans, long summaries, fake precision, and unsupported superlatives.
