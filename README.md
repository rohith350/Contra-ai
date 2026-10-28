# Contra AI — Evidence-Driven Contradiction Research Agent

Contra is an autonomous AI research agent designed to combat confirmation bias. Powered by **NVIDIA Nemotron** (via Nebius Token Factory) and real web search retrieval, Contra decomposes user hypotheses into testable empirical claims, generates adversarial search vectors to retrieve disconfirming citations, and synthesizes a calibrated dialectical evidence dossier.

---

## The Six Signature Capabilities

1. **Adaptive Investigation Engine**: Autonomous query planning, coverage satisfaction checks, and transparent stopping rationale.
2. **Assumption Autopsy**: Premise deconstruction into underlying causal mechanisms, vulnerability ratings, and empirical evidence coverage.
3. **Live Investigation Timeline**: Real-time telemetry feed of dispatched query vectors, discovered corroborations, and empirical contradictions.
4. **Steelman vs. Red Team**: Bilateral dialectic contrasting the affirmative case against adversarial counter-arguments.
5. **Evidence Receipts**: Granular source citations with verified stance tags (`supporting`, `contradicting`, `neutral`), excerpts, methodology notes, and external URLs.
6. **Empirical Falsification Plan**: Operational testing procedures and quantitative thresholds required to refute the current conclusion.

---

## Architecture & Technology Stack

- **Backend**:
  - Python 3.11+
  - **FastAPI**: Async REST endpoints with Server-Sent Events (SSE) telemetry streaming
  - **Pydantic**: Strictly validated request and response data contracts
  - **NVIDIA Nemotron**: Dialectical reasoning engine via Nebius Token Factory (`nvidia/nemotron-4-340b-instruct`)
  - **ddgs (DuckDuckGo)**: Permitted, free real web retrieval with zero paid API requirement
  - **JSON Storage**: File-backed persistence in `data/investigations/`
  - **Pytest + Pytest-Asyncio**: Comprehensive test suite covering decomposition, classification, citation validation, inconclusive results, missing credentials, and API failures.
- **Frontend**:
  - React 19 + TypeScript + Vite
  - 3D Neural Sphere Canvas (`ContraAISphere.tsx`)
  - Two-page ChatGPT-inspired research workspace with live timeline and evidence tabs

---

## Zero-Paid-Usage & Free-Demo Safety

This backend is designed with a **zero-paid-usage goal**:
- **Local Mock Fallback**: When `NEBIUS_API_KEY` is not provided, the backend automatically operates in an explicitly labelled high-fidelity local mock mode (`ALLOW_MOCK_FALLBACK=true`, `is_mock=True`), allowing full UI and feature development without cost.
- **Configurable Application-Level Limits**:
  - `MAX_SEARCH_QUERIES`: 5 queries per investigation
  - `MAX_RESULTS_PER_QUERY`: 4 items per query
  - `MAX_MODEL_CALLS`: 10 model inferences per investigation
  - `MAX_OUTPUT_TOKENS`: 2,048 tokens per call
  - `INVESTIGATION_TIMEOUT_SECONDS`: 120 seconds
- **Zero Hardcoded Secrets**: Credentials are read strictly from backend environment variables and `.env`. A sanitized `.env.example` template is provided.

---

## Environment Configuration

Copy the template file to `.env`:

```powershell
Copy-Item .env.example .env
```

Configuration parameters:

| Variable | Default | Description |
|---|---|---|
| `NEBIUS_API_KEY` | `""` | API key for Nebius Token Factory (OpenAI-compatible) |
| `NEBIUS_BASE_URL` | `https://api.tokenfactory.nebius.ai/v1` | Endpoint for Nebius Token Factory |
| `NEBIUS_MODEL_ID` | `nvidia/nemotron-4-340b-instruct` | Primary NVIDIA Nemotron model ID |
| `ALLOW_MOCK_FALLBACK`| `true` | Enables zero-cost local mock inference if key is missing |
| `MOCK_MODE` | `false` | Explicitly forces mock inference even if key is present |
| `MAX_SEARCH_QUERIES` | `5` | Maximum search queries dispatched per investigation |
| `MAX_RESULTS_PER_QUERY` | `4` | Maximum citations retrieved per search query |
| `MAX_MODEL_CALLS` | `10` | Hard cap on model calls per run to prevent quota overrun |
| `DATA_DIR` | `./data/investigations` | Directory for JSON investigation persistence |

---

## Quickstart: Windows PowerShell Commands

### 1. Install Backend Dependencies

```powershell
# In repository root: c:\Users\Sharon Sunu George\MyProject\Contra-ai
pip install -r backend/requirements.txt
```

### 2. Run Backend Test Suite

```powershell
# Run the 17-test verification suite
python -m pytest backend/tests/ -v
```

### 3. Start the Backend Server

```powershell
# Starts the FastAPI server on port 8000
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

### 4. Start Frontend Development Server

In a second terminal:

```powershell
npm run dev
```

Visit the dashboard at `http://127.0.0.1:5173/` or `http://127.0.0.1:5173/#dashboard`.

---

## API Endpoints Reference

### 1. Health & Configuration Telemetry
- **`GET /health`**
- Returns backend health, configured limits, and whether live Nebius inference or local mock mode is active.

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

### 2. Create Investigation
- **`POST /api/investigations`**
- Accepts hypothesis and optional prior sources, initializes storage, and launches asynchronous background research.

```powershell
$body = @{ hypothesis = "Electric vehicles have a higher lifecycle carbon footprint than modern hybrid vehicles." } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/investigations" -Method Post -Body $body -ContentType "application/json"
$res
```

### 3. Retrieve Investigation Status
- **`GET /api/investigations/{id}`**
- Returns real-time status (`queued`, `researching`, `completed`, `inconclusive`, `failed`), progress percentage, active query vector, and decomposed claims.

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/investigations/$($res.id)"
```

### 4. Stream Live Progress via Server-Sent Events (SSE)
- **`GET /api/investigations/{id}/events`**
- Streams real-time event packets (`status`, `progress`, `timeline`, `complete`, `error`).

```powershell
curl -N "http://127.0.0.1:8000/api/investigations/$($res.id)/events"
```

### 5. Retrieve Evidence Dossier
- **`GET /api/investigations/{id}/report`**
- Returns the complete final Evidence Dossier matching the frontend `InvestigationReport` schema.

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/investigations/$($res.id)/report"
```
