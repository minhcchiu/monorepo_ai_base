---
name: Modern Infrastructure Orchestrator
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434655'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#006242'
  on-tertiary: '#ffffff'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
  status-healthy: '#10b981'
  status-healthy-bg: '#ecfdf5'
  status-healthy-text: '#065f46'
  status-warning: '#f59e0b'
  status-warning-bg: '#fffbeb'
  status-warning-text: '#92400e'
  status-critical: '#f43f5e'
  status-critical-bg: '#fff1f2'
  status-critical-text: '#9f1239'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.005em
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.02em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: -0.01em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-sm: 1rem
  margin: 2rem
  margin-sm: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system targets modern software engineers, DevOps leads, and technical founders who demand clarity, precision, and high operational velocity. The brand personality balances effortless technical sophistication with approachable warmth: it feels like an elite developer workbench—uncluttered, calm under pressure, and inherently trustworthy.

The visual style blends **Modern SaaS Minimalism** with architectural precision inspired by platforms like Linear and Vercel. Surfaces are deliberately quiet to let mission-critical telemetry, deployment graphs, and terminal outputs speak clearly. The experience balances high-density utility with generous negative space, offering progressive disclosure: straightforward and human at first glance, but comprehensive and powerful on deep inspection.

## Colors

The palette establishes a clean, high-contrast, distraction-free environment.

- **Canvas & Surfaces:**
  - Base canvas: `#F8FAFC` (Slate 50) delivers comfortable visual warmth without the sterility of pure white.
  - Cards & containers: `#FFFFFF` (White) layered against the canvas to create clear visual separation.
  - Sub-surfaces & muted fills: `#F1F5F9` (Slate 100) for table headers, inactive toggle tracks, and code background panels.

- **Typography & Content:**
  - High-emphasis text: `#0F172A` (Slate 900) for primary headings, metric values, and primary actions.
  - Medium-emphasis text: `#334155` (Slate 700) for body copy, labels, and table cells.
  - Subtle & helper text: `#64748B` (Slate 500) for secondary metadata, timestamps, and input placeholders.

- **Borders & Dividers:**
  - Hairline borders: `#E2E8F0` (Slate 200) for structural bounding boxes, row dividers, and tab bars.
  - Interactive border hover: `#CBD5E1` (Slate 300).

- **Brand Primary & Semantics:**
  - **Brand Primary:** `#2563EB` (Royal Blue) driving focal points, primary buttons, active navigation, and selection rings.
  - **Success / Healthy:** `#10B981` (Emerald 500) indicating zero downtime, running containers, and successful deploys.
  - **Warning / Degraded:** `#F59E0B` (Amber 500) for high CPU/memory utilization and impending quota limits.
  - **Critical / Error:** `#F43F5E` (Rose 500) for failing builds, crashed services, and destructive actions.

## Typography

The typography scale utilizes **Inter** for all prose, navigational labels, and interface elements, paired with **JetBrains Mono** for developer-centric data: commit hashes, IP addresses, environment keys, CLI parameters, and log outputs.

- Negative letter-spacing is applied systematically to headlines above 18px to tighten visual density and impart a crisp, product-grade polish.
- Numbers in telemetry dashboards, uptime trackers, and resource monitors must utilize tabular figures (`font-variant-numeric: tabular-nums`) to prevent horizontal jitter during real-time streaming updates.

## Layout & Spacing

The layout is built on a responsive 12-column grid anchored by a fixed lateral navigation shell (collapsible to 64px icon-only, expanding to 240px default).

- **Grid Strategy:**
  - **Desktop (>= 1280px):** 12 columns, max-width bounded container of 1440px or fluid full-width for metric canvases, 24px (`gutter`) column separation, 32px (`margin`) outer padding.
  - **Tablet (768px - 1279px):** 8 columns, 16px (`gutter-sm`) separation, 24px outer margins. Navigation sidebar collapses into a fixed drawer overlay.
  - **Mobile (< 768px):** 4 columns, 16px margins, single-column vertical stack for project cards and telemetry stats.

- **Rhythm & Padding:**
  - Intra-component spacing adheres to a strict 4px/8px baseline rhythm.
  - Use `space-xs` (4px) between tightly coupled icons and text.
  - Use `space-sm` (8px) for internal pill padding and button gaps.
  - Use `space-md` (16px) for form control stacking and standard card padding.
  - Use `space-lg` (24px) for card body padding on desktop.
  - Use `space-xl` (40px) for macro section delineation across infrastructure clusters.

## Elevation & Depth

Visual hierarchy is communicated via clean tonal layers and delicate ambient shadows rather than dramatic drop-shadows.

- **Level 0 (Flat Canvas):** `#F8FAFC`. Background for application dashboards and page shells.
- **Level 1 (Card & Section Surfaces):** `#FFFFFF` bounded by a 1px hairline border (`#E2E8F0`) paired with a micro ambient shadow: `0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.03)`.
- **Level 2 (Interactive Hover & Dropdowns):** Popovers, dropdown menus, and hovered cards elevate using `0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.04)` over a `#FFFFFF` fill with border `#CBD5E1`.
- **Level 3 (Modals & Overlays):** Centered modal dialogs sit atop a translucent backdrop (`rgba(15, 23, 42, 0.4)` with `backdrop-filter: blur(4px)`) and carry a deeper shadow: `0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)`.

## Shapes

The design uses balanced, modern rounded geometry that feels friendly yet engineered.

- Standard inputs, buttons, chips, and metric widgets utilize `rounded` (8px / 0.5rem) to maintain geometric rhythm.
- Large content panels, server cluster wrappers, and dashboard overview cards use `rounded-lg` (16px / 1rem).
- Full-page modals, empty-state containers, and onboarding hero modules use `rounded-xl` (24px / 1.5rem).
- Status indicators, presence avatars, and terminal pill tags adopt a complete circular radius (`rounded-full` / 9999px).

## Components

- **Buttons:**
  - *Primary:* Solid `#2563EB` fill, `#FFFFFF` text, subtle inset highlight `box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.15)`. Hover transition to `#1D4ED8`.
  - *Secondary:* `#FFFFFF` background, `#0F172A` text, 1px `#E2E8F0` hairline border, micro shadow. Hover background `#F8FAFC`, border `#CBD5E1`.
  - *Destructive:* `#FFFFFF` fill, `#F43F5E` text and border hover. Active trigger transitions to solid `#F43F5E` fill with white text.
  - *Sizing:* Default 36px height with 12px horizontal padding; compact 28px height with 8px horizontal padding for inline table toolbars.

- **Cards & Resource Containers:**
  - Pure white background (`#FFFFFF`) with 1px border (`#E2E8F0`) and `rounded-lg` (16px).
  - Hover states on clickable project/server cards introduce a 1px border shift to `#93C5FD` and an elevated Level 2 shadow without shifting layout dimensions.

- **Status Badges & Chips:**
  - Compact badges featuring an 8px circular status indicator dot.
  - Healthy state: Light green tint `#ECFDF5`, text `#065F46`, pinging `#10B981` dot.
  - Degraded/Building: Light amber tint `#FFFBEB`, text `#92400E`, pulsing `#F59E0B` dot.
  - Stopped/Error: Light rose tint `#FFF1F2`, text `#9F1239`, solid `#F43F5E` dot.

- **Inputs & Form Controls:**
  - Height 36px, `rounded` (8px), background `#FFFFFF`, border 1px `#E2E8F0`.
  - Focus state: Border transitions to `#2563EB` accompanied by an ambient focus ring: `0 0 0 3px rgba(37, 99, 235, 0.15)`.
  - Monospace inputs dedicated to environment variables and secret tokens use `code-md` styling with an embedded "Copy" action button.

- **Selection Controls (Checkboxes & Radios):**
  - Checkboxes use `rounded` (4px) with hairline border `#CBD5E1`. Checked state transitions to `#2563EB` with an affirmative white checkmark.
  - Radios use standard circular geometry with a centered solid inset indicator.

- **Logs & Telemetry Viewers:**
  - Dedicated developer panels built on `#0F172A` deep slate background with `JetBrains Mono` typography.
  - Log level prefixes color-coded to semantic tokens: `info` (`#60A5FA`), `warn` (`#FBBF24`), `err` (`#F87171`).