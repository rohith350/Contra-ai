# TEAM_PROTECTION_RULES.md — Contra AI

Strict engineering rules for multi-contributor protection, scope isolation, Git safety, and contract integrity across human and AI agent workflows.

---

## 1. Protecting Teammate Work
- **Authorization Required**: Never overwrite, recreate, delete, rename, move, or replace another contributor's work without explicit user or teammate authorization.
- **No Preference Rewrites**: Never rewrite working implementations merely because an AI agent or contributor prefers an alternative library, structure, or paradigm.
- **Scoped Improvements**: Do not interpret a request to improve or refine a specific feature as permission to make unrelated architectural, layout, or backend changes.
- **Ownership Clarity**: If ownership of a file, module, or schema is ambiguous, inspect the history and ask for clarification before modifying it.

---

## 2. Frontend / Backend Ownership Boundaries
- **Frontend Isolation**: Frontend tasks must remain strictly within the authorized frontend scope (UI, components, styles, local view routing, client-side state).
- **Backend Protection**: Do not modify backend routes, research logic, agent orchestration, model integrations (e.g., NVIDIA Nemotron services), database models, schemas, or tests during frontend-only tasks.
- **Contract Coordination**: Any modification to shared data contracts (payload shapes, endpoint routes, status codes) must be coordinated and approved by the responsible backend teammate.
- **No Parallel Duplication**: Do not create duplicate implementations, fallback mock servers, or competing API clients for features already owned by a teammate.

---

## 3. File Protection Guidelines
- **Inspect Before Editing**: Read existing files, inspect imports, consumers, and Git status before performing edits.
- **Minimal Targeted Changes**: Make the smallest safe change that accomplishes the task. Do not replace an entire file when a targeted edit is sufficient.
- **No Eager Deletions**: Never delete files simply because they appear unused in the immediate context.
- **Protected Core Assets**: Always protect shared CSS/tokens, routing declarations, API clients, TypeScript definitions, project configuration, manifests, package lockfiles, static assets, and documentation.

---

## 4. API Contract & Integration Protection
- **Preserve Agreed Interfaces**: Maintain established endpoint paths, HTTP verbs, request/response bodies, streaming event types, identifiers, and citation schemas.
- **Inspect Real Contracts**: Always inspect existing implementations or specifications (`docs/UX_ARCHITECTURE.md`, backend routes) before integrating frontend features.
- **No Fabricated Capabilities**: Never invent fictional backend endpoints, fabricate live citations, or mask missing APIs with permanent hardcoded mock data.
- **Document & Flag Gaps**: When backend functionality is absent or incomplete, document the missing fields clearly and coordinate rather than silently mutating the shared contract.

---

## 5. Git Safety & History Preservation
- **Pre-flight Status**: Run `git status --short` before starting any task to understand modified, staged, and untracked files.
- **Preserve Uncommitted Work**: Never discard, overwrite, or reset working tree changes left by teammates.
- **Destructive Commands Prohibited**: Never run `git reset --hard`, `git clean -fd`, force-push (`git push --force`), rewrite published history, or checkout over dirty files without explicit authorization.
- **Careful Conflict Resolution**: Never resolve merge conflicts by blindly accepting all incoming or current changes. Resolve conflicts surgically by understanding both intents.
- **Clean Staging**: Do not stage or commit unrelated files, artifacts, or temporary files.

---

## 6. Dependencies, Configuration & Secret Hygiene
- **Manifest Protection**: Do not overwrite `package.json`, lockfiles (`package-lock.json`), build configuration (`vite.config.ts`), or TypeScript configurations (`tsconfig*.json`) without a justified technical need and explicit authorization.
- **No Gratuitous Upgrades**: Avoid unnecessary dependency additions or major version upgrades.
- **Zero Secret Exposure**: Never expose, hardcode, or commit API keys, tokens, credentials, or `.env` secrets into the repository.

---

## 7. Mandatory Task Execution Sequence
Every contributor and AI coding agent must follow this exact sequence:
1. **Inspect**: Examine existing files, framework, dependencies, and `git status --short`.
2. **Identify Ownership & Risks**: Determine frontend/backend boundaries and evaluate potential regressions.
3. **Plan the Smallest Safe Change**: Formulate a targeted plan before writing code.
4. **List Files**: Explicitly identify target files and keep protected files untouched.
5. **Implement Safely**: Execute only the authorized changes.
6. **Verify Rigorously**: Run linting (`npm run lint`), type-checking, and production builds (`npm run build`).
7. **Report Transparently**: State files modified, tests executed, actual outcomes, and any unresolved items.

---

## 8. Stop Conditions & Escalation
**STOP AND ASK FOR AUTHORIZATION IMMEDIATELY IF A CHANGE RISKS:**
- Overwriting or discarding a teammate's uncommitted or committed work.
- Deleting, renaming, or refactoring existing files outside the immediate task.
- Modifying an unapproved shared backend/frontend API contract.
- Overwriting project manifests, build setups, or lockfiles.
- Resolving merge conflicts destructively or ambiguously.

---

### Core Principle
> **"Improve the existing project; do not recreate the project around your preferred implementation."**
