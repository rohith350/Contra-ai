# AGENTS.md — Instructions for AI Coding Agents

Guidelines and mandatory protocols for AI agents (Antigravity, Claude, Copilot, Cursor, etc.) working on the Contra AI repository.

---

## 1. Mandatory Pre-Flight Checklist
Before modifying any code in this repository, every agent MUST:
1. **Read `TEAM_PROTECTION_RULES.md`**: Understand ownership rules, Git safety, and contract boundaries.
2. **Read `README.md` and `docs/UX_ARCHITECTURE.md`**: Understand the product thesis, existing routing, and architecture.
3. **Check Nested Rules**: Read any applicable nested `AGENTS.md` files before modifying files in subdirectories.
4. **Inspect Git State**: Run `git status --short` to see dirty, staged, and untracked files. Do not discard or reset uncommitted work.
5. **Inspect Project Architecture**: Understand existing dependencies in `package.json`, styling tokens in `src/styles/index.css`, and existing components.
6. **Plan First**: Formulate the smallest complete, targeted change. Do not perform wholesale rewrites.

---

## 2. Product Context & Philosophy

**Contra AI** is an autonomous, evidence-driven research agent that challenges cognitive assumptions by investigating both supporting and contradictory evidence.

- **Non-Dogmatic Adversarial Analysis**: Contra does not automatically disagree with or reject a hypothesis. Its synthesis must reflect empirical evidence and explicitly acknowledge uncertainty.
- **Powered by NVIDIA Nemotron**: Backs dialectical decomposition, claim parsing, and evidence gap identification.

### The Six Signature Capabilities:
1. **Adaptive Investigation Engine**: Autonomous query planning, coverage satisfaction checks, and stopping rationale.
2. **Assumption Autopsy**: Deconstruction of claims into underlying premises, structural vulnerabilities, and evidence coverage.
3. **Live Investigation Timeline**: Sequential telemetry tracking dispatched queries, discoveries, and contradictions.
4. **Steelman vs. Red Team**: Bilateral dialectic presenting the strongest affirmative case alongside substantive counter-arguments.
5. **Evidence Receipts**: Granular source citations with verified stance tags, excerpts, methodology notes, and external URLs.
6. **Empirical Falsification Plan**: Operational test conditions and quantitative thresholds required to refute the current conclusion.

*Note: Never claim these capabilities are fully connected to a live backend unless the actual backend implementation confirms it.*

---

## 3. Scope & Ownership Boundaries
- **Frontend vs. Backend**:
  - The frontend engineer owns `src/`, `public/`, `index.html`, and `src/styles/`.
  - The backend teammate owns server endpoints, model orchestration, database models, and research services.
  - Do not create mock backend servers or unilaterally mutate shared request/response schemas.
- **Preserve Established Architecture**:
  - Consult [`docs/UX_ARCHITECTURE.md`](file:///c:/Users/Rohith%20B%20G/Contra-Ai/docs/UX_ARCHITECTURE.md) as the authority for page separation.
  - Keep the **Landing Page** (`#` / `#landing`) informational. Do not add search inputs or investigation controls to the landing page.
  - Keep the **Investigation Workbench** on `#investigate`.
  - Keep the **Live Research Telemetry & 3D Neural Sphere** on `#live`.
  - Keep the **Evidence Dossier** on `#dossier`.
- **No Duplicate Structures**:
  - Do not create parallel or duplicate pages, routes, components, API clients, or CSS systems.
  - Reuse existing components in `src/components/` and routes in `src/hooks/useNavigation.ts`.

---

## 4. Visual & Technical Constraints
- **Modern Dark Design System**:
  - Surfaces: `#050505` ground, `#0E0E0E` panel, `#222222` / `#303030` hairlines.
  - Accents: Mint (`#3FD6C6`) for live status and verification truth signals.
  - Typography: Geist / Geist Mono.
  - Buttons: White pill buttons (`#050505` text) for primary actions.
- **3D Neural Core (`ContraAISphere.tsx`)**:
  - Maintain the single Three.js canvas implementation. Never mount duplicate renderers or particle components.
  - Animate smoothly via LERP interpolation across typed states: `idle`, `listening`, `researching`, `report-ready`, `error`.
  - Never use animation to simulate fake backend success.
  - Respect `prefers-reduced-motion` and dispose of GPU resources cleanly on unmount.
- **Accessibility**:
  - Ensure all controls are keyboard accessible with visible focus indicators.
  - Do not rely on color alone to convey status.

---

## 5. Verification Protocol
After every change:
1. Run `npm run lint` (`oxlint src`). Ensure 0 errors.
2. Run `npm run build` (`tsc -b && vite build`). Ensure 0 type or build errors.
3. Verify routes in the running development server (`http://127.0.0.1:5173/`).
4. Report files changed and actual verification results. Never claim success without testing.
