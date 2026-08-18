# 🔍 AgentSherlock

<p align="center">
  <strong>Autonomous AI Incident Investigator for Developers and SREs</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#security">Security</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Verified%20End--to--End-brightgreen?style=for-the-badge" alt="Status Badge">
  <img src="https://img.shields.io/badge/Framework-Next.js%2015-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%2F%20Prisma-blue?style=for-the-badge&logo=postgresql" alt="Postgres">
  <img src="https://img.shields.io/badge/AI%20Providers-Claude%20%7C%20Gemini-orange?style=for-the-badge" alt="AI Providers">
</p>

---

## ⚡ Overview

**AgentSherlock** is an autonomous AI-powered incident investigation platform. Instead of acting as a generic chatbot wrapper, AgentSherlock acts as an AI SRE Agent equipped with 9 specialized, bounded inspection tools. 

Upload your application log files and source-code repository (`.zip`), describe the incident, and let the agent autonomously inspect logs, search repository files, and analyze Git commit histories to generate **evidence-backed root causes**, a **0–100 confidence score**, a **recommended remediation plan**, and a **publishable Markdown incident report**.

> [!NOTE]
> **Verified End-to-End**: Successfully identifies root causes (e.g., connection-pool exhaustion), correlates regression commits, and cites exact line numbers and log lines.

---

## ✨ Features

- 🤖 **Autonomous Investigation Agent**: Runs bounded iterative tool calls (up to 24 steps) to search logs, view source code, and analyze Git history.
- 🛠️ **9 Specialized AI Inspection Tools**:
  - Log analysis: `search_logs`, `read_log_section`
  - Code inspection: `list_repository_files`, `search_code`, `read_source_file`
  - Git analysis: `get_git_log`, `get_git_diff`, `get_git_show`, `find_recent_changes`
- 🎯 **Evidence-Backed Reasoning**: Every conclusion is strictly tied to real log snippets, code lines, or Git diffs with assigned confidence levels (`weak`, `strong`, `confirmed`).
- 📊 **Strict Zod Schema Validation**: AI outputs are validated against typed schemas before database persistence—rejecting malformed AI responses automatically.
- 💡 **Actionable Recommended Fix**: Generates immediate workarounds, long-term code fixes, and monitoring suggestions.
- 📄 **Deterministic Incident Report**: Instant 8-section Markdown report generated from stored investigation data (making **0 additional AI calls**).
- 🧪 **Seeded Demo Incident**: Experience a real-world payment service outage scenario out-of-the-box with real logs and git commits.
- 🔀 **Multi-Provider AI Engine**: Switch seamlessly between **Anthropic Claude** (Production) and **Google Gemini** (Free-tier local testing).

---

## 🔄 How It Works

```mermaid
flowchart TD
    A[1. Incident Intake] -->|Logs & Code ZIP| B[2. Autonomous AI Agent]
    B -->|Search & Read Bounded Data| C[3. 9 Inspection Tools]
    C -->|Gather Evidence & Commits| B
    B -->|Zod Schema Validation| D[4. Persisted Findings]
    D -->|Root Cause & Confidence| E[5. Fix Recommendation]
    D -->|Stored Investigation Data| F[6. Markdown Incident Report]
```

---

## 🏗️ Architecture

```
Next.js 15 (App Router, React, Tailwind CSS, shadcn/ui)
 └── PostgreSQL / Prisma Database
      └── Incident & Uploaded Artifact Storage (Logs & Repository Git History)
           └── AI Agent Core (Anthropic Claude & Google Gemini Providers)
                ├── Tools Core (search_logs, read_source_file, get_git_diff, etc.)
                ├── Zod Validation Engine (Strict schema enforcement)
                └── Output Generators (Fix Recommendation & Deterministic Report)
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Lucide Icons, Recharts
- **Database & ORM**: PostgreSQL, Prisma ORM
- **AI Integrations**: Anthropic Claude API (`@anthropic-ai/sdk`), Google Gemini API (`@google/genai`)
- **Validation & Testing**: Zod, Vitest

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon Postgres)

### Installation

1. **Clone & Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Copy `.env.example` to `.env` and fill in your details:
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/agentsherlock"
   ANTHROPIC_API_KEY="your-anthropic-api-key"

   # Optional: Use Gemini for free local testing
   AI_PROVIDER="gemini"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. **Database Setup**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run Application**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

Run the automated test suite powered by **Vitest**:

```bash
npm test
```

*Covers Git security checks, path-traversal prevention, Zod schema validation, ZIP extraction limits, and report builder formatting guarantees.*

---

## 🔒 Security & Guardrails

- 🛡️ **Server-Side API Key Protection**: Environment variables and keys are server-bound and never exposed to the client bundle.
- 🚫 **No Code Execution**: Uploaded code is strictly inspected as plain text or via `git` commands—never executed, compiled, or evaluated.
- 🔒 **Command & Parameter Sanitization**: Git parameters are sanitized and invoked exclusively via `execFile('git', [...])` with strict regex hex-hash checks (`^[0-9a-fA-F]{4,40}$`).
- 📁 **Path Traversal Guards**: Strict `path.relative()` confinement checks prevent directory traversal both during ZIP extraction and tool invocations.

---

<p align="center">
  Designed & Built with ❤️ for Developers & SREs.
</p>

