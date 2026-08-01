<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge" alt="License" />
</p>

<h1 align="center">AI Audit Trail</h1>

<p align="center">
  <strong>Enterprise-grade AI governance platform with blockchain-style tamper-proof audit logging, role-based access control, and Shadow AI detection.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#api-reference">API Reference</a> •
  <a href="#deployment">Deployment</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Features

### Tamper-Proof Audit Chain
Every AI interaction is logged with a **SHA-256 hash chain** — each entry references the previous entry's hash, making any retroactive modification instantly detectable. A built-in chain verification endpoint lets you validate the entire audit history in one call.

### AI Chat Console
A built-in chat interface powered by **OpenAI GPT-4o-mini** that automatically logs every prompt, response, model rationale, token usage, and cost — all linked to the authenticated user.

### Shadow AI Detector
A **Chrome Extension** that passively monitors browser tabs for visits to external AI services (ChatGPT, Microsoft Copilot, GitHub Copilot). Only site-level metadata is recorded — **no prompts, responses, or page content are ever captured**.

### Role-Based Access Control
Three built-in roles with differentiated permissions:

| Role | Chat | Audit Trail | Database Viewer | Reviews |
|------|:----:|:-----------:|:---------------:|:-------:|
| **Analyst** | Yes | No | No | No |
| **Reviewer** | Yes | Yes | Yes | Yes |
| **Compliance Officer** | Yes | Yes | Yes | Yes |

### Cost Analytics
Track AI spend across models with per-response cost calculation. Filter by date range and view breakdowns by model version.

### Audit Trail Certificates
Generate shareable, verifiable certificates for individual audit entries — perfect for compliance documentation and regulatory reporting.

### Data Export
Export the complete audit trail as **JSON** or **CSV** with optional filters for source type and date range.

### Human Review Workflow
Compliance officers and reviewers can **approve** or **flag** any AI response, with the review itself logged as an immutable audit entry linked to the original response.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
│              React 19 · TypeScript · Tailwind               │
│              Vite · Framer Motion · Recharts                │
│                   Deployed on Vercel                        │
├─────────────────────────────────────────────────────────────┤
│                       REST API                              │
│                FastAPI · Uvicorn · Gunicorn                 │
│                   Deployed on Render                        │
├─────────────────────────────────────────────────────────────┤
│                      Database                               │
│             PostgreSQL (Supabase-hosted)                    │
├─────────────────────────────────────────────────────────────┤
│                  Browser Extension                          │
│           Chrome Manifest V3 · Shadow AI Detector           │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
LegalBot/
├── backend/
│   ├── main.py                 # FastAPI app & route definitions
│   ├── models.py               # SQLAlchemy models (User, AuditLogEntry, AuthSession)
│   ├── auth.py                 # Authentication, registration, RBAC
│   ├── audit_service.py        # Audit log creation & hash-chain verification
│   ├── chat_service.py         # OpenAI chat integration with auto-logging
│   ├── review_service.py       # Human review workflow
│   ├── export_service.py       # JSON/CSV export with filtering
│   ├── hashing.py              # SHA-256 hash chain utility
│   ├── pricing.py              # Per-model token cost calculation
│   ├── requirements.txt        # Python dependencies
│   ├── Procfile                # Gunicorn process definition
│   ├── runtime.txt             # Python 3.12 runtime
│   └── tests/
│       └── test_audit_log.py   # Audit log unit tests
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Main app with tab navigation
│   │   ├── LoginPage.tsx       # Authentication UI
│   │   ├── ChatConsole.tsx     # AI chat interface
│   │   ├── AuditTrail.tsx      # Audit log viewer & review UI
│   │   ├── DatabaseViewer.tsx  # Raw database browser
│   │   ├── Certificate.tsx     # Shareable audit certificates
│   │   ├── NavBar.tsx          # Top navigation bar
│   │   ├── AuthContext.tsx     # React auth context provider
│   │   ├── config.ts           # API base URL config
│   │   └── index.css           # Global styles (Tailwind)
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json             # Vercel SPA routing
│   └── tsconfig.json
│
├── extension/
│   ├── manifest.json           # Chrome Manifest V3 config
│   ├── background.js           # Tab monitoring service worker
│   ├── popup.html              # Extension popup UI
│   ├── popup.js                # Popup logic & auth
│   └── styles.css              # Popup styling
│
└── README.md
```

---

## Quick Start

### Prerequisites

| Tool | Version |
|------|---------|
| **Python** | 3.12+ |
| **Node.js** | 18+ |
| **PostgreSQL** | 14+ (or a Supabase project) |
| **OpenAI API Key** | [Get one here](https://platform.openai.com/api-keys) |

---

### 1. Clone the Repository

```bash
git clone https://github.com/Abhinaykr6209/LegalBot.git
cd LegalBot
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:

```env
OPENAI_API_KEY=sk-your-openai-api-key
MODEL_NAME=gpt-4o-mini
DATABASE_URL=postgresql://user:password@host:port/dbname
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

Start the development server:

```bash
uvicorn main:app --reload --port 8000
```

> The API will be available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the interactive Swagger UI.

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

> The frontend will be available at `http://localhost:5173`.

### 4. Chrome Extension Setup (Optional)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right)
3. Click **Load unpacked** and select the `extension/` folder
4. The AI Audit Trail icon will appear in your toolbar

---

## Demo Accounts

The app seeds three demo users on first run:

| Username | Password | Role | Access Level |
|----------|----------|------|-------------|
| `alice` | `demo123` | Compliance Officer | Full access (Chat + Audit + DB + Reviews) |
| `bob` | `demo123` | Analyst | Chat Console only |
| `priya` | `demo123` | Reviewer | Full access (Chat + Audit + DB + Reviews) |

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive auth token |

### Chat

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/chat` | Bearer required | Send a message and receive an AI response (auto-logged) |

### Audit Logs

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/audit-logs` | Audit Role required | List audit log entries (paginated) |
| `POST` | `/api/audit-logs` | Audit Role required | Create a manual audit log entry |
| `GET` | `/api/audit-logs/verify` | Audit Role required | Verify the full hash chain integrity |
| `GET` | `/api/audit-logs/cost` | Audit Role required | Get cost analytics by model |
| `GET` | `/api/audit-logs/export` | Audit Role required | Export as JSON or CSV |
| `GET` | `/api/audit-logs/{id}` | Audit Role required | Get a specific entry by response ID |
| `GET` | `/api/audit-logs/{id}/reviews` | Audit Role required | Get all reviews for an entry |
| `POST` | `/api/audit-logs/{id}/review` | Audit Role required | Submit a review (approve/flag) |

### Database

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/db/audit-log-entries` | Audit Role required | Paginated, sortable, searchable table view |

### Shadow AI Detector

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/detector/event` | Optional | Log a Shadow AI browser detection event |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check with UTC timestamp |

---

## Security Notes

> [!CAUTION]
> **Never commit your `.env` file or API keys to version control.** Ensure `.env` is listed in your `.gitignore`.

- All passwords are hashed using **bcrypt** via Passlib
- Session tokens are generated with `secrets.token_hex(32)` (256-bit entropy)
- Legacy PBKDF2-SHA256 hashes are auto-migrated to bcrypt on login
- CORS origins are configurable via the `ALLOWED_ORIGINS` environment variable
- The Chrome extension captures **only** tab URL and title metadata — no page content, keystrokes, or form data

---

## Deployment

### Backend: Render / Railway / Heroku

The backend includes a `Procfile` for Gunicorn-based deployments:

```
web: gunicorn -w 2 -k uvicorn.workers.UvicornWorker main:app
```

Set the following environment variables on your hosting platform:

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `MODEL_NAME` | Model to use (default: `gpt-4o-mini`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `ALLOWED_ORIGINS` | Comma-separated list of frontend origins |

### Frontend: Vercel

The frontend includes a `vercel.json` for SPA routing. Deploy with:

```bash
cd frontend
npx vercel --prod
```

Update `src/config.ts` with your deployed backend URL before deploying.

---

## Running Tests

```bash
cd backend
pytest tests/ -v
```

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, TypeScript, Tailwind CSS 4, Vite 8, Framer Motion, Recharts, Lucide Icons |
| **Backend** | Python 3.12, FastAPI, SQLAlchemy, OpenAI SDK, Passlib + bcrypt |
| **Database** | PostgreSQL (Supabase) |
| **Extension** | Chrome Manifest V3, Service Workers |
| **Deployment** | Vercel (frontend), Render/Railway (backend) |

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/your-feature`
3. **Commit** your changes: `git commit -m "Add your feature"`
4. **Push** to the branch: `git push origin feature/your-feature`
5. **Open** a Pull Request

Please ensure your code passes linting and existing tests before submitting.

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <strong>Built for enterprise AI governance</strong>
  <br />
  <a href="https://github.com/Abhinaykr6209/LegalBot">Star this repo</a> if you find it useful!
</p>
