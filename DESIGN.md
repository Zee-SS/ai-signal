# AI Signal Design System

## Intent

AI Signal uses a light, editorial-product system described as “research desk in clear daylight.” It is optimised for repeated scanning on a 1920x1080 desktop display while retaining the same content priority at 390px. Live data is the visual material; the product does not need decorative imagery.

## Theme

The interface is light-only by product direction. The page uses an almost-white olive-tinted paper, near-black olive ink, restrained rules, and one deep olive interaction anchor. Category colours are semantic data tokens rather than competing brand accents.

## Colour

All implementation colours are declared as OKLCH custom properties.

- Paper: `oklch(0.991 0.002 110)`
- Surface: `oklch(0.975 0.004 110)`
- Raised surface: `oklch(0.958 0.006 110)`
- Ink: `oklch(0.185 0.012 110)`
- Secondary ink: `oklch(0.43 0.014 110)`
- Rule: `oklch(0.87 0.008 110)`
- Primary olive: `oklch(0.35 0.075 110)`
- Focus olive: `oklch(0.52 0.13 110)`
- Error, warning, and success always pair colour with text or an icon.
- Model violet, tool blue, benchmark amber, research green, event coral, and community cyan appear only where they encode content type.

## Typography

Use self-hosted Geist Variable for UI, headings, and body copy, with Geist Mono only for compact metadata, dates, versions, prices, and tabular numerals. Headings stay roman. The scale is deliberately compact: one 32px page title, 24px section titles, 17-18px item titles, 15-16px body, and 13-14px metadata. Long prose is capped near 68ch.

## Layout

- Hallmark macrostructure: Ecosystem Index adapted to a live product surface.
- Maximum reading width: 1440px with fluid 20-40px gutters.
- At 1440px and typical 1080p desktop windows, the main signal uses an editorial 7/5 split and dense sections use the full rail.
- At 1024px, secondary columns collapse or move beneath the primary content.
- At 768px and below, every section becomes a prioritised single-column flow.
- At 390px, tables become labelled records, source attribution remains visible, and controls keep 44px targets.
- Root overflow is clipped, never hidden, to preserve sticky behaviour and prevent horizontal scrolling.

## Components

- Header: one sticky DOM structure that compacts after a sentinel leaves view. The height remains stable and the transition uses transform and opacity only.
- Search: visible global input on desktop, full-width search surface on mobile, `/` shortcut, immediate keyboard focus.
- Cards: reserved for editorial emphasis, overlays, or genuinely independent records. Ordinary lists use space, type, and sparse rules.
- Buttons and inputs: 44px minimum height, 8px radius, constant border width, instant focus ring, subtle press scale.
- Drawers and popovers: Radix primitives only where focus management and dismissal complexity justify them.
- Data: tabular numerals and explicit labels. Mobile records never require horizontal scrolling.

## Motion

Motion intensity is 3/10. State feedback uses 100-180ms exponential ease-out. The header compaction, filter drawer, popover, and content-state crossfade are the only spatial transitions. Keyboard-triggered search and feed navigation are instant. `prefers-reduced-motion` collapses spatial movement to a short opacity change.

## States

Every data surface defines loading skeletons that match final geometry, informative empty states, contextual errors, stale-cache messaging, seeded-development labels, and partial-source-failure notices. Interactive controls cover default, hover, focus, active, disabled, loading, error, and success where applicable.

## Voice

Use concrete labels and source vocabulary. Prefer “Open source,” “Show cached data,” “No verified dates,” and “Fetched 19 Jul 2026” over generic error copy, vague AI slogans, or celebratory status messages.
