# Contra AI — Two-Page UX Architecture & Implementation Specification

## Executive Overview
**Contra AI** is an autonomous, evidence-driven research agent that challenges cognitive assumptions by investigating both supporting and contradictory evidence.

In accordance with user requirements, the product user experience is consolidated into exactly **TWO primary user-facing pages**:
1. **Landing Page (`#` or `#landing`)**: An informational overview presenting the problem of confirmation bias, Contra's dialectical methodology, the six signature capabilities, and a preview of evidence reports, with a single primary CTA into the workspace.
2. **Investigation Dashboard (`#dashboard` or `#investigate`)**: A unified, ChatGPT-inspired research workspace featuring a left sidebar (branding, new investigation, real session history, overview link) and a main stage that smoothly transitions between states (Welcome/Intake -> Live Research Telemetry -> Evidence Dossier) without navigating across separate top-level pages.

---

## 1. Two-Page Information Architecture

```
+---------------------------------------------------------------------------------------------------------+
|                                              CONTRA AI                                                  |
+---------------------------------------------------------------------------------------------------------+
       |
       +---> PAGE 1: Landing Page (`#` or `#landing`)
       |       * Strictly informational, no search inputs or live queries.
       |       * Minimal Contra branding + top navigation ("Methodology", "Capabilities", "Evidence Preview").
       |       * Hero: Clear value thesis — "Evidence-Driven Research Against Confirmation Bias".
       |       * Methodology Pillars: Hypothesis Decomposition, Dialectical Search, Credibility & Synthesis.
       |       * Six Capabilities Matrix: Clean, concise breakdown of the 6 signature features.
       |       * Evidence Report Preview: Subtle sample dossier card.
       |       * Prominent Action: "Start Investigating" button -> opens Page 2 (`#dashboard`).
       |
       +---> PAGE 2: Investigation Dashboard (`#dashboard`)
               * Single, connected research workspace.
               * LEFT SIDEBAR:
               |   - Contra branding & status pill ("v1.0 • Dialectical Engine").
               |   - "New Investigation" button (`+` icon, resets workspace to clean intake state).
               |   - Investigation History list (real stored queries/reports with timestamps).
               |   - Clear return link: "← Overview" (returns to Landing Page).
               |
               * MAIN WORKSPACE (Dynamic Single-Canvas Lifecycle):
                   - STATE A: Welcome / Standby (Empty)
                       * Centered welcome title: "What hypothesis shall we challenge?"
                       * Subtitle explaining empirical cross-examination of supporting vs opposing evidence.
                       * Compact 3D Neural Core in subtle `idle` / `listening` state (non-distracting).
                       * Quick-start prompt suggestion chips (e.g. EV emissions, remote work, sodium intake).
                       * Large, accessible hypothesis input area with submit button.
                   - STATE B: Active Investigation (Researching)
                       * Compact claim badge at the top showing the active query.
                       * Adaptive Investigation Engine card (query planner, coverage satisfaction %, stopping rationale).
                       * Live Investigation Timeline (chronological event stream: searches, discoveries, contradictions).
                       * 3D Neural Core in gentle `researching` pulse mode (retained as subtle visual indicator).
                       * Cancellation action: "Cancel Run" (returns to input).
                   - STATE C: Completed Investigation (Evidence Dossier in Same Workspace)
                       * Dossier Header: Hypothesis title, date, certainty score %, calibrated bias rating.
                       * Navigation tabs/segmented control within workspace:
                           [ Executive Summary ]  [ Assumption Autopsy ]  [ Steelman vs Red Team ]  [ Evidence Receipts ]  [ Falsification Plan ]
                       * Tab 1: Executive Summary & Synthesis with key takeaways.
                       * Tab 2: Assumption Autopsy (deconstructed subclaims, vulnerabilities, evidence coverage).
                       * Tab 3: Steelman vs. Red Team (bilateral dialectic: affirmative case vs. counter-evidence).
                       * Tab 4: Evidence Receipts (granular citations with stance tags, excerpts, methodology, URLs).
                       * Tab 5: Falsification Plan (operational test procedures and empirical refutation thresholds).
                       * Ability to return to Live Timeline via toggle without losing active investigation results.
```

---

## 2. Page Specifications

### Page 1: Landing Page (`#` / `#landing`)
* **Role**: Informational portal for visitors and evaluators.
* **Layout**: Centered responsive single-column layout (max-width `1180px`), clean dark backdrop (`#050505`).
* **Sections**:
  1. **Minimal Header**: Brand lockup (`CONTRA / AI`), subtle links (`#methodology`, `#capabilities`, `#preview`), and primary pill button `"Start Investigating"`.
  2. **Hero Statement**:
     - Eyebrow: `NVIDIA NEMOTRON DIALECTICAL AGENT`
     - Headline: `Research that challenges your assumptions.`
     - Subhead: `Most AI search confirms what you want to hear. Contra independently investigates both supporting and contradictory evidence, identifying structural assumptions, evidence gaps, and falsification conditions.`
     - Primary CTA: `"Start Investigating"` (White pill button -> `#dashboard`).
  3. **The Problem & Methodology**:
     - Concise 3-column or 4-column cards: Hypothesis Decomposition, Adversarial Retrieval, Credibility & Gap Analysis, Calibrated Synthesis.
  4. **The Six Signature Capabilities**:
     - 6 compact cards (Adaptive Engine, Assumption Autopsy, Live Timeline, Steelman vs Red Team, Evidence Receipts, Falsification Plan) describing how each capability protects research integrity.
  5. **Dossier Preview**:
     - A subtle, styled mockup showing an excerpt of an Evidence Dossier (e.g. EV lifecycle emissions) to set expectations of output quality.
  6. **Footer**:
     - Minimal copyright, architecture link, and back-to-top control.

### Page 2: Investigation Dashboard (`#dashboard`)
* **Role**: The unified ChatGPT-style working environment.
* **Layout**:
  - Two-pane desktop layout: Fixed/collapsible **Left Sidebar** (`260px` width) and fluid **Main Workspace** (`calc(100% - 260px)`).
  - Tablet/Mobile: Responsive off-canvas sliding sidebar with drawer toggle button.
* **Left Sidebar**:
  - Top: Contra AI logo with live mint heartbeat indicator.
  - Action: `"New Investigation"` white pill button with `+` icon.
  - Section Header: `RECENT INVESTIGATIONS`
  - History List: Real history items recorded during the session (hypothesis title, timestamp, status). Clicking loads the completed report or active state.
  - Footer: Clear navigation link `"← Overview"` returning to the Landing Page.
* **Main Workspace States**:
  - **1. Welcome / Standby State (No active run)**:
    - Clean centered container (`max-width: 760px`).
    - Title: `"Challenge a hypothesis with empirical evidence."`
    - Subtitle: `"Enter a claim, scientific proposition, or strategic assumption. Contra will retrieve supporting citations and adversarial counter-arguments."`
    - Compact 3D Neural Core: Height `180px`, rendered cleanly in `idle` mode.
    - Quick-select prompt chips:
      * *"Electric vehicles have higher lifecycle emissions than modern hybrids."*
      * *"AI code generation increases defect density in critical systems."*
      * *"Remote work decreases long-term engineering innovation."*
    - Prompt Input Box: Auto-expanding textarea or large input with submit button, character counter, and keyboard submit (`Enter` to submit, `Shift+Enter` for newline).
  - **2. Researching State (Telemetry)**:
    - Active query banner with hypothesis and elapsed time.
    - Adaptive Investigation Engine progress: Coverage progress bar (e.g. 18% -> 100%), active query vector, coverage check reasoning.
    - Live Timeline: Chronological event stream with typed badges (`search`, `discovery`, `contradiction`, `gap`, `synthesis`).
    - Compact Neural Core in `researching` state with pulse indicator.
    - Stop / Cancel button.
  - **3. Completed State (Evidence Dossier)**:
    - Rendered in the main workspace without page reload or route hopping.
    - Header: Evaluated claim, timestamp, certainty score %, bias classification (`Balanced Evidence`, `Affirmative Bias`, `Contradictory Stance`).
    - Tabbed Navigation Bar:
      * `Executive Synthesis` (Verdict, Key findings, uncertainty level)
      * `Assumption Autopsy` (Premises, structural vulnerabilities, evidence coverage)
      * `Steelman vs Red Team` (Bilateral argument matrix)
      * `Evidence Receipts` (Granular citations, stance badges, excerpts, links)
      * `Falsification Plan` (Empirical testing conditions)
      * `Timeline Telemetry` (Toggle to inspect the investigation audit trail)
    - Action Bar: `"New Investigation"`, `"Copy Summary"`, `"Export Dossier"`.
  - **4. Error & Inconclusive States**:
    - Graceful error banner with retry option if API fails.
    - Inconclusive notification if evidence gap satisfaction cannot be achieved.

---

## 3. How the Six Signature Capabilities Appear in the Workflow

| # | Capability | Workflow Phase | Dashboard Placement & Interaction |
|---|---|---|---|
| **1** | **Adaptive Investigation Engine** | Active Research & Dossier | Displayed as live coverage card during search (`AdaptiveEngineCard.tsx`); summarized in Dossier header with stopping rationale. |
| **2** | **Assumption Autopsy** | Completed Report | Dedicated tab in Dossier workspace (`AssumptionAutopsy.tsx`); exposes premise deconstruction, vulnerability rating, and coverage. |
| **3** | **Live Investigation Timeline** | Active Research & Review | Primary view during research (`LiveTimeline.tsx`); accessible anytime via the "Timeline Telemetry" tab in the completed dossier. |
| **4** | **Steelman vs. Red Team** | Completed Report | Dedicated tab in Dossier workspace (`SteelmanRedTeam.tsx`); bilateral presentation of the affirmative case vs counter-evidence. |
| **5** | **Evidence Receipts** | Completed Report | Dedicated tab in Dossier workspace (`EvidenceReceipts.tsx`); interactive list of citations with verified stances, excerpts, and URLs. |
| **6** | **Empirical Falsification Plan** | Completed Report | Dedicated tab in Dossier workspace (`FalsificationCard.tsx`); operational test procedures and quantitative thresholds required to refute findings. |

---

## 4. Visual Design System & Design Tokens

Consistent with [`AGENTS.md`](file:///c:/Users/Rohith%20B%20G/Contra-Ai/AGENTS.md) and existing styles:
* **Backgrounds**:
  - App Ground: `#050505`
  - Sidebar Ground: `#090909`
  - Panel / Cards: `#0e0e0e`
  - Elevated Popups / Modals: `#141414`
* **Borders & Dividers**:
  - Subtle Hairline: `#1f1f1f`
  - Focused / Hover Hairline: `#303030`
  - Active Selection: `#3fd6c6` (1px mint)
* **Typography**:
  - Heading & Reading: Geist Sans (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`)
  - Code, Meta & Telemetry: Geist Mono (`"Geist Mono", SFMono-Regular, Consolas, monospace`)
  - Landing Hero: `clamp(2.5rem, 5vw, 4.25rem)`
  - Page Headings: `28px - 34px`
  - Section Headings: `18px - 22px`
  - Body Text: `15px - 16px` (line-height `1.55`)
  - Metadata / Badges: `12px - 13px`
* **Accents**:
  - Live Mint: `#3fd6c6` (status pulses, verification markers)
  - Supporting Green: `#22c55e`
  - Contradicting Amber/Red: `#f59e0b` / `#ef4444`
* **Buttons**:
  - Primary Action: White pill button (`background: #f2f2f2; color: #050505; font-weight: 550; border-radius: 9999px`)
  - Secondary Action: Graphite outline pill (`background: #141414; border: 1px solid #2a2a2a; color: #d0d0d0`)
* **Responsive Breakpoints**:
  - Desktop: `> 1024px` (Full sidebar + spacious workspace)
  - Tablet: `768px - 1024px` (Collapsible sidebar drawer)
  - Mobile: `< 768px` (Full-width workspace, drawer sidebar, stacked cards)

---

## 5. Navigation & State Transitions

1. **Routes**:
   - `#` or `#landing` -> Renders `HomePage.tsx` (Informational Landing Page).
   - `#dashboard` (or `#investigate`) -> Renders `DashboardPage.tsx` (Unified Workspace).
   - If user visits legacy `#live` or `#dossier`, `useNavigation` smoothly directs to `#dashboard` with appropriate state preserved.
2. **State Machine inside `DashboardPage`**:
   - `workspaceState`: `'idle' | 'researching' | 'completed' | 'error'`
   - `activeTab`: `'synthesis' | 'autopsy' | 'dialectic' | 'receipts' | 'falsification' | 'timeline'`
   - `history`: Array of past investigation summaries stored in React state.
3. **User Flow**:
   - User on Landing Page clicks `"Start Investigating"` -> URL changes to `#dashboard` -> Workspace opens in `'idle'` welcome state.
   - User enters hypothesis or clicks sample chip -> clicks `"Investigate"` -> Workspace shifts to `'researching'`, live telemetry runs via mock/real timeline.
   - Research reaches 100% -> Workspace shifts to `'completed'` -> Evidence Dossier appears in the workspace with tab selector.
   - User clicks `"New Investigation"` in the sidebar -> Workspace clears back to `'idle'` welcome state.
   - User clicks `"← Overview"` in sidebar -> Navigates back to `#landing`.

---

## 6. File Architecture & Changes Plan

### Files to Modify:
1. `src/hooks/useNavigation.ts`: Simplify routes to `'landing' | 'dashboard'`, with backward compatibility for `#investigate`, `#live`, `#dossier`.
2. `src/pages/HomePage.tsx`: Polish informational landing page with the six capabilities matrix, subtle preview, and primary CTA.
3. `src/styles/HomePage.css`: Match refined Modern Dark typography and spacing.
4. `src/pages/DashboardPage.tsx`: Implement the full ChatGPT-inspired workspace (Sidebar + Welcome state + Researching state + Tabbed completed Dossier).
5. `src/styles/DashboardPage.css`: Full responsive styling for the two-pane dashboard.
6. `src/App.tsx`: Route purely between `HomePage` and `DashboardPage`.

### Files to Reuse As-Is:
- `src/components/ContraAISphere.tsx` (3D Neural Core)
- `src/components/AdaptiveEngineCard.tsx` (Adaptive Engine)
- `src/components/AssumptionAutopsy.tsx` (Assumption Autopsy)
- `src/components/LiveTimeline.tsx` (Live Timeline)
- `src/components/SteelmanRedTeam.tsx` (Steelman vs Red Team)
- `src/components/EvidenceReceipts.tsx` (Evidence Receipts)
- `src/components/FalsificationCard.tsx` (Falsification Plan)
- `src/services/sample-report.ts` (Sample research dataset)
- `src/types/investigation.ts` (Investigation types)

### Files Untouched (Protected Boundaries):
- All backend files / external server code (teammate boundary).
- Build and configuration files (`vite.config.ts`, `package.json`, `tsconfig.json`).

---

## 7. Verification Protocol
1. **Linter**: `npm run lint` (`oxlint src`) -> 0 errors.
2. **Build**: `npm run build` (`tsc -b && vite build`) -> 0 errors.
3. **Browser Verification**:
   - Check Landing Page (`#`): Informational only, contains 6 capabilities, evidence preview, "Start Investigating" button.
   - Check Dashboard (`#dashboard`):
     - Empty welcome state with quick prompt chips.
     - Sidebar with New Investigation button, history, and back to Overview.
     - Submit hypothesis -> smooth transition to active research with live telemetry.
     - Completion -> renders full Dossier with all tabs (Synthesis, Autopsy, Dialectic, Receipts, Falsification, Timeline).
     - Test responsive mobile drawer and reduced-motion compliance.
