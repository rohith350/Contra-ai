# Contra AI — UX Architecture Specification & Implementation Blueprint

## Executive Overview
**Contra AI** is an evidence-driven, dialectical research agent that actively counteracts confirmation bias. Powered by NVIDIA Nemotron, Contra accepts user hypotheses, decomposes claims into underlying assumptions, dispatches autonomous adversarial search queries, evaluates empirical and contradictory evidence, and compiles transparent, source-cited Evidence Dossiers.

---

## 1. Product Information Architecture (4 Core Responsibilities)

The application separates concerns across four distinct states/views governed by declarative client routing (`#landing`, `#investigate`, `#live`, `#dossier`):

```
+-----------------------------------------------------------------------------------------+
|                                    CONTRA AI APP                                        |
+-----------------------------------------------------------------------------------------+
       |
       +---> 1. Landing Page (`#` or `#landing`)
       |       - Product thesis, anti-confirmation bias philosophy, methodology pillars
       |       - Real dialectical scenarios & architecture breakdown
       |       - Primary CTA: "Launch Investigation Workbench" -> Navigates to Step 2
       |
       +---> 2. Start Investigation (`#investigate`)
       |       - Hypothesis intake & claim formulation
       |       - Interactive claim templates / examples
       |       - Preliminary search depth & bias parameters
       |       - Primary Action: "Initialize Autonomous Investigation" -> Transitions to Step 3
       |
       +---> 3. Live Investigation (`#live`)
       |       - Observable adaptive research telemetry with NVIDIA Nemotron
       |       - 3D Neural Core in dynamic synaptic mode (`researching`)
       |       - Adaptive Investigation Engine: live query dispatch & coverage checks
       |       - Real-time research timeline (queries, discoveries, contradictions, stopping rationale)
       |       - On completion: Transitions to Step 4
       |
       +---> 4. Evidence Dossier (`#dossier`)
               - Executive Findings & Calibrated Bias Metric
               - Assumption Autopsy: subclaims, vulnerabilities & evidence coverage
               - Steelman vs. Red Team: fair affirmative vs. substantive counter-case
               - Evidence Receipts: full citations, source stances, credibility, limitations
               - Falsification Plan: empirical testing criteria & conditions that invalidate the hypothesis
```

---

## 2. Page-by-Page Specifications & Wireframes

### A. Landing Page (`#landing` or root `#`)
* **Purpose**: Informational homepage. Explains why confirmation bias corrupts research and how Contra solves affirmative sycophancy.
* **Layout**: Single column, centered reading container (max 1120px).
* **Sections**:
  1. Top Navigation: Brand identity (`CONTRA / AI`), methodology jump-links, `"Launch Workbench"` CTA.
  2. Hero Section: NVIDIA Nemotron tag, headline, product explanation, dual action buttons (`"Start Investigation"`, `"Explore Architecture"`).
  3. System Architecture: 4-pillar methodology (`Hypothesis Decomposition`, `Dialectical Evidence Search`, `Source Credibility`, `Dossier Synthesis`).
  4. Dialectical Analysis Scenarios: Concrete examples showing affirmative claims cross-examined against counter-evidence.
  5. CTA Banner & Preserved Ecosystem documentation.

### B. Start Investigation (`#investigate`)
* **Purpose**: Hypothesis intake. Focused workbench for formulating clear, falsifiable hypotheses.
* **Layout**: Two columns (1.15fr / 0.85fr).
* **Left Column**:
  - Breadcrumb navigation (`← Overview`).
  - Prominent hypothesis input with search glyph and keyboard shortcuts (`Enter` to submit).
  - Categorized hypothesis sample cards (Engineering, Biomedicine, Macroeconomics).
  - Investigation depth indicator & methodology toggles.
  - Primary button: `"Initialize Investigation"`.
* **Right Column**:
  - Neural Core in `listening` standby.
  - Pre-flight heuristic checklist (Claim clarity, empirical testability, dialectical scope).

### C. Live Investigation (`#live`)
* **Purpose**: Observable research process. Transparent, real-time feedback during evidence retrieval.
* **Layout**: Two columns (1.1fr / 0.9fr).
* **Left Column**:
  - Active claim focus badge.
  - **Adaptive Investigation Engine** status card: Claim decomposition, query dispatch tracker, coverage check progress bar, stopping rationale.
  - **Live Investigation Timeline**: Sequential event log of queries dispatched, sources evaluated, and gaps identified.
* **Right Column**:
  - Framed 3D Neural Core in `researching` state with telemetry HUD.
  - Real-time telemetry indicators (Nodes Active, Synapses Fired, Evidence Sources Queried).
  - Immediate view action once complete: `"Open Evidence Dossier"`.

### D. Evidence Dossier (`#dossier`)
* **Purpose**: Final comprehensive findings, structured analysis, and falsification criteria.
* **Layout**: Hierarchical structured report container (max 1280px).
* **Sections**:
  1. Dossier Header: Target hypothesis, investigation timestamp, verification certainty rating, and navigation controls (`← New Investigation`, `Print / Export`).
  2. **Assumption Autopsy**: Visual breakdown of underlying premises, confidence ratings, and identified vulnerabilities.
  3. **Steelman vs. Red Team**: Side-by-side comparative analysis of the strongest affirmative argument vs. the strongest counter-argument.
  4. **Evidence Receipts**: Interactive table/cards of cited sources with stance tags (`Supporting`, `Contradicting`, `Neutral`), methodology notes, and external URLs.
  5. **Falsification Plan**: Operational criteria specifying what empirical finding would invalidate or alter the conclusion.

---

## 3. Modern Dark Design Tokens

All interfaces adhere strictly to the established design foundation:
* **Backgrounds**: `--dp-color-ground: #050505`, `--dp-color-panel: #0e0e0e`, `--dp-color-hairline: #222222`.
* **Accents & Signals**: `--dp-color-live: #3fd6c6` (mint for active status & truth signals).
* **Typography**: Geist Sans for headings and reading copy; Geist Mono for metadata, source details, and telemetry.
* **Buttons**: White pill buttons with `#0a0a0a` text for primary actions; graphite bordered pills for secondary.
* **Maximum Width**: `1360px`, respecting desktop gutters (48px) and mobile gutters (20px).
* **Motion**: 120ms transitions with immediate `prefers-reduced-motion` compliance.

---

## 4. Feature Placement & Data Contracts

| Feature | Primary Location | Supporting Location | Data Contract / Fields | Fallback Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **1. Adaptive Investigation Engine** | Live Investigation (`#live`) | Start (`#investigate`) | `claimDecomposition: string[]`, `activeQuery: string`, `coverageScore: number`, `stoppingRationale: string` | Displays heuristic decomposition based on user prompt |
| **2. Assumption Autopsy** | Evidence Dossier (`#dossier`) | Live Investigation (`#live`) | `assumptions: { premise: string, status: 'verified' \| 'challenged' \| 'unresolved', vulnerability: string }[]` | Formats extracted subclaims with explicit uncertainty notices |
| **3. Live Investigation Timeline** | Live Investigation (`#live`) | Dossier Audit Log | `timeline: { id: string, timestamp: string, type: 'search' \| 'evidence' \| 'gap' \| 'decision', detail: string }[]` | Generates sequential telemetry steps tracking engine state |
| **4. Steelman vs. Red Team** | Evidence Dossier (`#dossier`) | Landing (Examples) | `steelman: { title: string, argument: string, keyEvidence: string[] }`, `redTeam: { title: string, argument: string, keyEvidence: string[] }` | Formulates balanced dual-stream arguments without affirmative sycophancy |
| **5. Evidence Receipts** | Evidence Dossier (`#dossier`) | Research Reports | `receipts: { id: string, title: string, url: string, source: string, date: string, stance: 'supporting' \| 'contradicting', excerpt: string, limitation: string }[]` | Presents cited sources with explicit stances; never fakes broken URLs |
| **6. Falsification Plan** | Evidence Dossier (`#dossier`) | Report Footer | `falsification: { testProcedure: string, measurableMetric: string, thresholdForFalsification: string }` | Provides concrete operational tests that would change the stance |

---

## 5. Implementation Phases

1. **Phase 1**: Types & Data Models (`src/types/investigation.ts`).
2. **Phase 2**: Navigation Router (`src/hooks/useNavigation.ts`) supporting `#landing`, `#investigate`, `#live`, and `#dossier`.
3. **Phase 3**: Component Architecture:
   - `src/components/AdaptiveEngineCard.tsx` (Live progress & stopping logic).
   - `src/components/LiveTimeline.tsx` (Chronological research events).
   - `src/components/AssumptionAutopsy.tsx` (Deconstructed premises & weaknesses).
   - `src/components/SteelmanRedTeam.tsx` (Bilateral argument synthesis).
   - `src/components/EvidenceReceipts.tsx` (Cited sources & stance classification).
   - `src/components/FalsificationCard.tsx` (Hypothesis invalidation criteria).
4. **Phase 4**: Dedicated Pages:
   - `src/pages/HomePage.tsx` (Strictly informational).
   - `src/pages/StartInvestigationPage.tsx` (Input & hypothesis formulation).
   - `src/pages/LiveInvestigationPage.tsx` (Engine telemetry & 3D sphere).
   - `src/pages/EvidenceDossierPage.tsx` (Final findings, receipts & falsification plan).
5. **Phase 5**: Verification & Polish:
   - Build validation (`npm run build`), linter checks (`npm run lint`), responsive checks.
