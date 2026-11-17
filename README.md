# KrishiAssist 🌾
### Explainable AI-Powered Agricultural Support & Decision System

<p align="center">
  <strong>Empowering Farmers with Accessible, Explainable and Personalized Agricultural Support</strong>
</p>

<p align="center">
  <a href="https://krishiassist.vercel.app">Live Application</a> •
  <a href="https://krishiassist-api.onrender.com">Backend API</a> •
  <a href="https://github.com/maansi1004/KrishiAssist">GitHub Repository</a>
</p>

---

## Overview

**KrishiAssist** is a farmer-centric agricultural support platform designed to simplify the discovery and understanding of government agricultural schemes.

Farmers often face difficulties identifying relevant schemes, understanding eligibility conditions, finding required documents and navigating application procedures. KrishiAssist brings these resources together in one platform and provides personalized, explainable guidance based on farmer information and agricultural needs.

Instead of functioning as just another chatbot, KrishiAssist combines structured agricultural scheme data, a deterministic eligibility engine, farmer profiles and contextual assistance to guide users towards relevant support opportunities.

> **Core principle: AI understands. Rules decide. Evidence explains. Workflow guides.**

## Live Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://krishiassist.vercel.app |
| Backend API | Render | https://krishiassist-api.onrender.com |
| Database | Render PostgreSQL | Managed PostgreSQL instance |

The frontend and backend are deployed independently and communicate through HTTP API requests.

The backend uses environment-based configuration, while PostgreSQL provides persistent production data storage.

*Note: Render's free web service may spin down after inactivity, which can cause a delay on the first request.*

---

## Key Features

### 1. Government Scheme Discovery
- Browse and search agricultural government schemes.
- Explore schemes based on agricultural needs and relevant categories.
- Review scheme benefits, eligibility requirements and application information.
- Access official scheme resources where available.

### 2. Explainable Eligibility Evaluation
- Evaluate farmer information against structured scheme eligibility criteria.
- Use a deterministic, rule-based eligibility engine.
- Present criterion-level evaluation results.
- Identify missing information and verification requirements.
- Explain why a scheme matches or does not match a farmer's profile.

**Important:** Eligibility decisions are determined by the rule engine, not by an LLM or recommendation score. Unknown information is not automatically treated as satisfied.

### 3. Farmer Profiles
- Register and authenticate farmer accounts.
- Maintain reusable farmer profiles.
- Store relevant agricultural and personal information.
- Use profile information to support personalized scheme discovery and eligibility checks.

### 4. Saved Schemes and Application Tracking
- Save relevant schemes for future reference.
- Maintain application tracking records.
- Monitor application progress and status.
- Access previous eligibility evaluations and activity records.

### 5. Agricultural Guidance and Assistant
- Ask agriculture-related and scheme-related questions.
- Receive contextual guidance based on available scheme and agricultural knowledge.
- Support natural-language interactions.
- Use an optional external LLM fallback when configured.

### 6. Application Guidance and Documents
- Review scheme-specific document requirements.
- Understand application steps.
- Access relevant official application resources.
- Organize document-related information and application progress.

KrishiAssist provides guidance and tracking; it does not automatically submit applications to government portals.

### 7. Multilingual Experience
- English
- Hindi
- Hinglish

The interface and assistant include multilingual foundations to make agricultural information more accessible.

### 8. Eligibility Reports
- Generate PDF reports containing eligibility-related information.
- Review evaluation outcomes and supporting details.

---

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Styling | CSS |
| Backend | Python, FastAPI, Pydantic |
| Database | PostgreSQL (production), SQLite (local development) |
| ORM | SQLAlchemy |
| Database migrations | Alembic |
| Authentication | JWT, password hashing |
| Scheme intelligence | Structured JSON data, JSON Schema validation |
| Eligibility evaluation | Deterministic rule-based engine |
| AI integration | Optional external LLM integration |
| API server | Uvicorn |
| Backend testing | pytest |
| Frontend deployment | Vercel |
| Backend deployment | Render |
| Version control | Git and GitHub |

---

## System Architecture

KrishiAssist follows a modular three-tier architecture.

```text
                    FARMER
                       |
                       v
             REACT + TYPESCRIPT
                FRONTEND
                  Vercel
                       |
                  HTTP / API
                       |
                       v
                FASTAPI BACKEND
                   Render
                       |
          +------------+-------------+
          |            |             |
          v            v             v
     Authentication  Scheme       Farmer
       & Profiles    Services     Workflows
          |            |             |
          |            v             |
          |      Eligibility Engine  |
          |            |             |
          |            v             |
          |       Explanation        |
          |        & Results         |
          |                          |
          +------------+-------------+
                       |
                       v
                SQLAlchemy ORM
                       |
                       v
                PostgreSQL DB
                  Render
```

### Eligibility Evaluation Flow

```text
Farmer Information / Natural-Language Need
                    |
                    v
          Need Understanding
                    |
                    v
          Scheme Discovery
                    |
                    v
       Structured Scheme Criteria
                    |
                    v
        Deterministic Rule Engine
                    |
                    v
          Eligibility Evaluation
                    |
                    v
          Explainability Layer
                    |
          +---------+----------+
          |         |          |
          v         v          v
        Results   Missing    Verification
                  Details     Requirements
                    |
                    v
          Documents & Next Steps
                    |
                    v
          Application Tracking
```

### Separation of AI and Eligibility Logic

The system follows an important trust and reliability principle:

- AI can assist with natural-language understanding, intent classification, summarization, translation and explanations.
- The deterministic rule engine evaluates eligibility against structured scheme criteria.
- Unknown or unverified requirements remain explicitly uncertain.
- Recommendation relevance is separate from actual eligibility.
- Official scheme information should be verified against authoritative sources.

This separation prevents an AI-generated response from becoming an unsupported eligibility decision.

---

## Project Structure

The repository contains the `ka/` project directory.

```text
KrishiAssist/
|
└── ka/
    |
    ├── backend/
    |   ├── app/
    |   |   ├── api/
    |   |   ├── auth/
    |   |   ├── core/
    |   |   ├── db/
    |   |   ├── engines/
    |   |   ├── i18n/
    |   |   ├── models/
    |   |   ├── schemas/
    |   |   ├── services/
    |   |   └── main.py
    |   |
    |   ├── migrations/
    |   |   ├── versions/
    |   |   └── env.py
    |   |
    |   ├── alembic.ini
    |   └── requirements.txt
    |
    ├── frontend/
    |   ├── src/
    |   |   ├── components/
    |   |   ├── pages/
    |   |   ├── App.tsx
    |   |   └── main.tsx
    |   |
    |   ├── public/
    |   ├── package.json
    |   └── vite.config.ts
    |
    ├── data/
    |
    ├── docs/
    |
    ├── storage/
    |   └── uploads/
    |
    ├── tests/
    |
    ├── .env.example
    ├── .gitignore
    ├── ADMIN_GUIDE.md
    ├── DOCUMENTS_GUIDE.md
    ├── README.md
    ├── RUN.md
    ├── SECURITY_NOTES.md
    ├── SETUP_WINDOWS.bat
    ├── START_BACKEND.bat
    └── START_FRONTEND.bat
```

*The structure above summarizes the main project directories and files; individual modules may evolve as development continues.*

---

## Getting Started Locally

### Prerequisites

Install the following:

- Python 3.13 recommended
- Node.js and npm
- Git
- Visual Studio Code or another code editor

### 1. Clone the Repository

```bash
git clone https://github.com/maansi1004/KrishiAssist.git
cd KrishiAssist/ka
```

### 2. Backend Setup

Open a terminal:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\activate
```

Install dependencies:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Backend Environment Variables

Create a `.env` file in the project configuration location expected by the backend.

Use `.env.example` as a reference.

Example configuration:

```env
APP_ENV=development

DATABASE_URL=sqlite:///./krishiassist.db

JWT_SECRET=replace-with-a-strong-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_MINUTES=60

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

OPENROUTER_API_KEY=
LLM_MODEL=
```

Do not commit your `.env` file or expose credentials in GitHub.

### 4. Run Database Migrations

From the backend directory:

```bash
alembic upgrade head
```

This applies the database schema defined by the project's Alembic migration history.

### 5. Start the Backend

From the backend directory:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The backend should now be available at:

```text
http://127.0.0.1:8000
```

### 6. Start the Frontend

Open another terminal:

```bash
cd ka/frontend
```

Install dependencies:

```bash
npm install
```

Create or configure the frontend `.env` file:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the Vite development server:

```bash
npm run dev
```

Open the local frontend URL:

```text
http://localhost:5173
```

---

## Environment Variables

### Backend

| Variable | Purpose |
|---|---|
| `APP_ENV` | Application environment (`development` or `production`) |
| `DATABASE_URL` | Database connection URL |
| `JWT_SECRET` | Secret used to sign authentication tokens |
| `JWT_ALGORITHM` | JWT signing algorithm |
| `ACCESS_TOKEN_MINUTES` | Access token lifetime |
| `CORS_ORIGINS` | Comma-separated allowed browser origins |
| `OPENROUTER_API_KEY` | Optional external LLM API key |
| `LLM_MODEL` | Optional model identifier |
| `UPLOAD_DIR` | Document upload storage directory |
| `MAX_UPLOAD_MB` | Maximum allowed upload size |
| `MAX_DOCUMENTS_PER_USER` | Per-user document limit |
| `MAX_STORAGE_MB_PER_USER` | Per-user storage limit |

Other rate-limiting and upload configuration options are defined in the backend settings module.

### Frontend

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |

Vite exposes variables prefixed with `VITE_` to frontend code. Never put private credentials or secrets in frontend environment variables.

---

## Production Deployment

KrishiAssist is currently deployed using Vercel, Render and Render PostgreSQL.

### Frontend — Vercel

**Deployment URL:** https://krishiassist.vercel.app

Configuration:

| Setting | Value |
|---|---|
| Framework | Vite |
| Root Directory | `ka/frontend` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Environment Variable | `VITE_API_URL` |

Production environment variable:

```env
VITE_API_URL=https://krishiassist-api.onrender.com
```

The frontend is connected to the GitHub repository and can be redeployed when changes are pushed to the configured branch.

### Backend — Render

**Deployment URL:** https://krishiassist-api.onrender.com

Configuration:

| Setting | Value |
|---|---|
| Root Directory | `ka/backend` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Python Version | 3.13.5 |

Required production environment variables include:

```env
APP_ENV=production
DATABASE_URL=<RENDER_POSTGRESQL_CONNECTION_URL>
JWT_SECRET=<STRONG_RANDOM_SECRET>
JWT_ALGORITHM=HS256
CORS_ORIGINS=https://krishiassist.vercel.app
```

Set all credentials through Render's Environment settings. Do not hardcode them in source files.

### Database — Render PostgreSQL

The production backend uses a managed PostgreSQL database.

Database migrations are managed through Alembic.

Run migrations from the backend directory:

```bash
alembic upgrade head
```

The production database URL is supplied through the `DATABASE_URL` environment variable.

The backend configuration normalizes Render PostgreSQL connection URL formats for SQLAlchemy and Psycopg.

### CORS Configuration

The backend must allow requests from the deployed frontend domain.

Set:

```env
CORS_ORIGINS=https://krishiassist.vercel.app
```

If additional frontend environments are required, add their exact origins as comma-separated values.

After changing backend environment variables, redeploy the Render service if required.

---

## Testing and Validation

### Backend Tests

From the backend directory, activate the virtual environment and run:

```bash
python -m pytest -q
```

### Frontend Production Build

From the frontend directory:

```bash
npm run build
```

### Database Migration

From the backend directory:

```bash
alembic current
```

Apply pending migrations:

```bash
alembic upgrade head
```

### Suggested End-to-End Smoke Test

1. Open the deployed frontend.
2. Register a test farmer account.
3. Log in.
4. Create or update the farmer profile.
5. Browse and search agricultural schemes.
6. Run an eligibility evaluation.
7. Review the criterion-level explanation.
8. Check missing and verification-required information.
9. Save a scheme.
10. Review saved schemes.
11. Create or update an application tracking record.
12. Review past results and activity history.
13. Test the agricultural assistant.
14. Switch between available languages.
15. Refresh the website and verify that persistent information remains available.

Use test accounts and non-sensitive sample data.

---

## Security and Data Integrity

KrishiAssist handles farmer profiles, authentication information and application-related records. Security and data correctness are important.

- Use a strong, randomly generated JWT secret in production.
- Never commit passwords, API keys, database credentials, JWT secrets or `.env` files.
- Use HTTPS for deployed application communication.
- Keep database credentials private.
- Configure CORS to allow only trusted frontend origins.
- Apply database migrations through Alembic.
- Validate uploaded documents and enforce configured upload limits.
- Review authentication and authorization rules.
- Use non-sensitive sample data for testing.
- Maintain backups and an appropriate data-retention policy.

### Eligibility Reliability

- Eligibility must be determined by structured rules.
- Unknown requirements must remain unknown until sufficient information is available.
- Recommendation relevance must not be confused with eligibility.
- Scheme benefits, documents, deadlines and official application links must be checked against authoritative sources.
- An AI assistant must not override deterministic eligibility results or fabricate government policy.

---

## Current Scope and Limitations

- Scheme coverage depends on the structured dataset available in the project.
- Government scheme information can change and requires regular verification.
- The optional external LLM fallback depends on provider availability and valid configuration.
- Language coverage should be tested carefully across English, Hindi and Hinglish.
- Application tracking provides workflow support; government applications are not submitted automatically.
- Render free instances may experience cold-start delays after periods of inactivity.
- Production use should be accompanied by security review, backups, monitoring and real-world validation.

---

## Future Enhancements

Potential areas for continued development include:

- Expanding and regularly validating the scheme dataset.
- Improving multilingual agricultural assistance.
- Enhancing contextual retrieval and knowledge-base coverage.
- Adding more detailed administrative scheme-management workflows.
- Improving document verification and application guidance.
- Expanding automated testing and production monitoring.
- Conducting usability testing with farmers and agricultural stakeholders.

---

## Contributing

Contributions and suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Add or update relevant tests.
5. Run backend tests and the frontend production build.
6. Commit your changes with a descriptive message.
7. Open a pull request.

Please preserve the separation between AI-assisted language understanding and deterministic eligibility evaluation.

---

## License

No license has currently been specified for this repository. A suitable `LICENSE` file should be added before permitting reuse, redistribution or external contributions.

---

## Project Links

| Resource | Link |
|---|---|
| Live Application | https://krishiassist.vercel.app |
| Backend API | https://krishiassist-api.onrender.com |
| GitHub Repository | https://github.com/maansi1004/KrishiAssist |

---

<p align="center">
  <strong>KrishiAssist 🌾</strong><br/>
  Making agricultural support easier to discover, understand and navigate.
</p>

<p align="center">
  <em>AI understands. Rules decide. Evidence explains. Workflow guides.</em>
</p>
