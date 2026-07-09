<a href="https://distiq.app/">
  <h1 align="center">DistIQ</h1>
</a>

<p align="center">
<img alt="OG" src="public/images/opengraph-image.png" />
</p>

<p align="center">
DistIQ is an AI sales intelligence platform for B2B distribution teams, built with Next.js 16, React 19, TypeScript, PostgreSQL (Prisma 7), and shadcn/ui. It focuses on account/contact enrichment, target lists, campaigns, reports, and pipeline management.
</p>

<p align="center">
<a href="https://twitter.com/distiqapp">
<img alt="X (formerly Twitter) URL" src="https://img.shields.io/twitter/url?url=https%3A%2F%2Ftwitter.com%2Fdistiqapp">
</a>
  <a href="https://github.com/pdovhomilja/distiq-app/blob/main/LICENSE">
    <img alt="GitHub License" src="https://img.shields.io/github/license/pdovhomilja/distiq-app">
  </a>
</p>

<p align="center">
   <a href="#online-demo"><strong>Introduction</strong></a> ·
   <a href="#whats-new"><strong>What's New</strong></a> ·
   <a href="#tech-stack--features"><strong>Tech Stack + Features</strong></a> ·
   <a href="#roadmap"><strong>Roadmap</strong></a> ·
   <a href="#installation"><strong>Installation</strong></a> ·
   <a href="#repo-activity"><strong>Repo activity</strong></a> ·
   <a href="#license"><strong>License</strong></a> ·
   <a href="https://discord.gg/dHyxhTEyUb"><strong>Discord</strong></a>
</p>
<br/>

## Online Demo

You can try it here [demo.distiq.io](https://demo.distiq.io), then create an account with email and password.

---

## What's New

### 📋 CRM Activities — Full Activity Tracking *(NEW)*

All 5 CRM entity detail pages (Accounts, Contacts, Leads, Opportunities, Contracts) now have an **Activities** tab with a live paginated feed of interactions:

- **Activity types** — Notes, Calls, Emails, Meetings, Tasks
- **Create / edit / delete** — inline Sheet form on every CRM entity detail page
- **Paginated feed** — compound cursor pagination with `createdAt + id` for stable ordering
- **Linked records** — activities attach to multiple entities via `crm_ActivityLinks` (e.g. a call can reference both a Contact and an Opportunity)
- **Real-time revalidation** — server actions revalidate the correct path after every mutation

---

### 🕵️ Audit Log & History — Full Change Trail *(NEW)*

Every CRM entity (Accounts, Contacts, Leads, Opportunities, Contracts) now tracks its full change history:

- **History tab** — per-entity timeline of all field changes, shown on every detail page with `AuditTimeline` + `AuditEntry` components
- **Soft delete** — records are never hard-deleted; `deletedAt` column preserves data while hiding it from normal queries
- **Admin audit log** — `/admin/audit-log` shows a global filterable table of every change across all entities, with restore support for soft-deleted records
- **Diff engine** — `diffObjects` utility computes before/after diffs and stores structured JSON in the audit record

---

### 🧠 AI Enrichment — E2B Sandboxed Agent + Flexible API Key Management *(NEW)*

Target and Contact enrichment now runs inside an **[E2B](https://e2b.dev/) cloud sandbox** — a full Linux environment with a real browser (Chrome) — replacing the previous Firecrawl API path:

- **Real-browser research** — the agent navigates JS-heavy sites, LinkedIn public profiles, and paginated results that a simple API call cannot reach
- **LLM tool-use loop** — Claude Sonnet 4.6 drives the research with tools: `browser_open`, `browser_snapshot`, `browser_click`, `browser_extract`, `web_search`
- **C-level contact discovery** — given only a company name, the agent finds all discoverable C-level contacts and creates `crm_Target_Contact` records automatically
- **Context-aware strategy** — agent skips research it doesn't need (e.g. already has a website → skips domain discovery)
- **Confidence scoring** — fields below 0.6 confidence are discarded; only empty target fields are overwritten
- **5-minute timeout per target** — partial results are applied even if the agent times out
- **Fan-out** — after company enrichment, each discovered contact is enriched independently via a separate Inngest job

**API keys** are managed through a **3-tier priority system** so the app runs without any keys in `.env`:

```
ENV variable  →  Admin system-wide  →  User profile
(highest)                              (lowest)
```

- **Admin panel** (`/admin/llm-keys`) — set system-wide keys for OpenAI, Firecrawl, Anthropic, and Groq. Keys are encrypted at rest (AES-256-GCM).
- **Profile settings** (`/profile?tab=llms`) — users configure their own keys as a fallback.
- **Graceful degradation** — enrichment buttons show an informative dialog when no key is available at any tier.

> **Migration note:** The old `openAi_keys` table is replaced by the new `ApiKeys` table. Run `pnpm prisma migrate deploy` to apply the migration.

---

### 🤖 MCP Server — AI Agent Access to CRM Data *(NEW)*

DistIQ now ships with a built-in [Model Context Protocol](https://modelcontextprotocol.io/) server, letting AI agents (Claude, Cursor, custom agents) read and write CRM data directly.

**127 tools across 15 modules:**

| Module | Tools | Operations |
|--------|-------|------------|
| Accounts | 6 | list, get, search, create, update, delete |
| Contacts | 6 | list, get, search, create, update, delete |
| Leads | 6 | list, get, search, create, update, delete |
| Opportunities | 6 | list, get, search, create, update, delete |
| Targets | 6 | list, get, search, create, update, delete |
| Products | 5 | list, get, create, update, delete |
| Contracts | 5 | list, get, create, update, delete |
| Activities | 5 | list, get, create, update, delete |
| Documents | 8 | list, get, create, upload, download, link, unlink, delete |
| Target Lists | 7 | list, get, create, update, delete, add members, remove members |
| Enrichment | 4 | enrich contact, enrich target, bulk contact, bulk target |
| Email Accounts | 1 | list |
| Campaigns | 18 | full lifecycle: CRUD, send, pause, resume, templates, steps, stats |
| Projects | 18 | boards, sections, tasks, comments, documents, watch |
| Reports | 2 | list, run |

**Authentication:** Generate Bearer tokens (`nxtc__...`) from your profile page. Tokens are SHA-256 hashed — the raw value is shown only once and never stored.

**Connect your MCP client** (streamable HTTP — recommended):
```json
{
  "mcpServers": {
    "distiq": {
      "type": "http",
      "url": "https://your-distiq.com/api/mcp/mcp",
      "headers": { "Authorization": "Bearer nxtc__your_token_here" }
    }
  }
}
```

The server supports both MCP transports defined by `mcp-handler`:
- **Streamable HTTP** at `/api/mcp/mcp` — single POST endpoint, current MCP spec default
- **SSE (legacy)** at `/api/mcp/sse` — GET stream paired with POSTs to `/api/mcp/message` (client auto-discovers the message endpoint)

**Claude Code Skill:** Download the [SKILL.md](/en/profile?tab=developer) from your Developer profile tab for a ready-to-use Claude Code skill with full tool documentation.

---

### 🔍 Vector Search + Semantic Similarity *(NEW)*

CRM records (Accounts, Contacts, Leads, Opportunities) are automatically embedded using **OpenAI `text-embedding-3-small`** via [Inngest](https://www.inngest.com/) background jobs.

- **Unified search** — combines keyword (full-text) + semantic (pgvector cosine similarity) results in a single grouped UI
- **Find Similar** — every CRM detail page has a "Find Similar" button that surfaces semantically related records across the same module
- **Backfill** — Inngest function to embed all existing records on demand
- **Auto-embed** — new and updated records are embedded automatically

Powered by **pgvector** (PostgreSQL extension) with HNSW indexes for fast approximate nearest-neighbor search.

---

### 🎯 CRM Targets *(NEW)*

New **Targets** module for managing sales targets and target lists — full CRUD, detail view, list management, and MCP tools included.

---

### 🔎 Unified Search *(NEW)*

Global search across all CRM entities from a single search bar — grouped results by entity type, loading skeleton, collapsible sections, and combined keyword + semantic scoring.

---

## Tech Stack + Features

### Frameworks

- [Next.js 16](https://nextjs.org/) – React framework for building performant apps with the best developer experience (App Router)
- [Better Auth 1.5.x](https://www.better-auth.com/) – TypeScript-first authentication framework with email OTP, OAuth (Google), admin plugin, and session management
- [Prisma 7.5](https://www.prisma.io/) – TypeScript-first ORM for PostgreSQL
- [React Email 2.x](https://react.email/) – Versatile email framework for efficient and flexible email development

### Platforms

- [PostgreSQL 17+](https://www.postgresql.org/) – Powerful open-source relational database with **pgvector** extension for AI embeddings
- [Resend](https://resend.com/) – A powerful email framework for streamlined email development together with [react.email](https://react.email)
- [UploadThing](https://uploadthing.com/) + S3-compatible storage (DigitalOcean Spaces) – for document file storage
- [Inngest](https://www.inngest.com/) – Background job queue for async embedding and AI workflows

### AI & MCP

- [OpenAI API](https://openai.com/blog/openai-api) – `text-embedding-3-small` for vector embeddings; GPT for project management assistant
- [Anthropic API](https://www.anthropic.com/) – Claude Sonnet 4.6 drives the E2B enrichment agent tool-use loop
- [Vercel AI SDK 6.x](https://sdk.vercel.ai/) – Unified AI interface
- [pgvector](https://github.com/pgvector/pgvector) – PostgreSQL vector extension for similarity search (HNSW indexes)
- [E2B](https://e2b.dev/) – Cloud sandboxes with real Chrome browser for AI-driven web research and contact enrichment
- [MCP Server](https://modelcontextprotocol.io/) – 127 tools across 15 modules via `mcp-handler` (Vercel MCP adapter), Bearer token auth, streamable HTTP (`/api/mcp/mcp`) + legacy SSE (`/api/mcp/sse`) transports

### Data fetching

- [SWR](https://swr.vercel.app/) – React Hooks library for remote data fetching
- [Axios](https://axios-http.com/) – Promise based HTTP client for the browser and node.js
- [Server Actions]() – for server side data fetching and mutations
- [TanStack React Table](https://tanstack.com/table) – for data tables and server/client side data fetching

### UI

- [Tailwind CSS v4](https://tailwindcss.com/) – Utility-first CSS framework for rapid UI development
- [shadcn/ui](https://ui.shadcn.com/) – Re-usable components built using Radix UI and Tailwind CSS
- [Tremor](https://www.tremor.so/) – A platform for creating charts
- [Lucide React](https://lucide.dev/) – Beautiful and consistent open-source icons

### i18n

- [next-intl](https://next-intl-docs.vercel.app/) – Internationalization for Next.js — English, Czech, German, Ukrainian

![hero](/public/og.png)

## Roadmap

1. ✅ Docker version — complete bundle to run DistIQ on-premise
2. ✅ Upgrade to Next.js 16 — running on Next.js 16 with React 19
3. ✅ i18n / localization — 4 languages (English, Czech, German, Ukrainian)
4. ✅ Email client — IMAP/SMTP email client built in
5. ✅ PostgreSQL migration — migrated from MongoDB to PostgreSQL 17+
6. ✅ pgvector embeddings — automatic semantic embeddings via Inngest + OpenAI
7. ✅ Vector similarity search — "Find Similar" on all CRM entity detail pages
8. ✅ Unified search — keyword + semantic search across all CRM modules
9. ✅ CRM Targets module — sales target and target list management
10. ✅ MCP server — 25 CRM tools for AI agent access via Bearer token auth
11. ✅ AI enrichment — E2B sandboxed agent (real browser + Claude Sonnet) for target/contact enrichment; C-level contact discovery; 3-tier API key management (ENV → admin → user)
12. ✅ Audit log & history — soft delete + full field-level change trail on all CRM entities; global admin audit log page
13. ✅ CRM Activities — notes, calls, emails, meetings, tasks linked to any CRM entity; paginated feed on all detail pages
14. ✅ Distributor sales intelligence — account/contact enrichment, target lists, buying committee research, and pipeline workflows
15. 🔄 More AI powered features — daily summary of tasks and projects
15. 📋 Email campaigns management — integration with MailChimp and Listmonk
16. 🔄 Fix all TypeScript `any` types — ongoing cleanup

## Emails

We use [resend.com](https://resend.com) + [react.email](https://react.email) as primary email sender and email templates.

## Reports

We use Tremor charts as a tool for creating charts in DistIQ

![hero](/public/reports.png)

## Video (YouTube channel with functions showcase)

[Youtube Channel](https://www.youtube.com/@DistIQ_IO) </br>
[Invoice module (video)](https://youtu.be/NSMsBMy07Pg)

## Documentation

Available soon at: http://docs.distiq.io

## Installation

<details><summary><b>Show instructions</b></summary>

1. Clone the repository:

   ```sh
   git clone https://github.com/pdovhomilja/distiq-app.git
   cd distiq-app
   ```

1. Install the preset:

   ```sh
   pnpm install
   ```

1. Copy the environment variables to .env

   ```sh
   cp .env.example .env
   ```

   ```sh
   cp .env.local.example .env.local
   ```

   **.env**

   > > - You will need a PostgreSQL connection string for Prisma ORM
   > > - Example: `DATABASE_URL="postgresql://user:pass@localhost:5432/distiq?schema=public"`
   > > - Requires PostgreSQL 17+ with the **pgvector** extension enabled

   **.env.local**

   > > - BETTER_AUTH_SECRET - for auth
   > > - uploadthings - for storing files
   > > - openAI - for embeddings and project management assistant *(optional — can be set via admin panel instead)*
   > > - Firecrawl - for contact/target enrichment *(optional — can be set via admin panel instead)*
   > > - SMTP and IMAP for emails
   > > - Inngest - for background embedding jobs
   > > - `EMAIL_ENCRYPTION_KEY` - required for encrypting API keys stored in the database

1. Init Prisma

   ```sh
    pnpm prisma generate
    pnpm prisma migrate deploy
   ```

1. Import initial data from initial-data folder

   ```sh
   pnpm prisma db seed
   ```

1. Run app on local

   ```sh
   pnpm run dev
   ```

1. http://localhost:3000

</details>

## Docker Installation (Recommended for Self-Hosting)

The fastest way to run DistIQ is with Docker Compose. The provided `docker-compose.yml` bundles everything you need: the app, PostgreSQL (with pgvector), MinIO for file storage, and Inngest for background jobs. No manual setup of databases, buckets, or migrations — it all happens automatically on first start.

### Quick Start

```sh
git clone https://github.com/pdovhomilja/distiq-app.git
cd distiq-app
cp .env.docker .env
nano .env                # set service passwords, BETTER_AUTH_SECRET, and PUBLIC_APP_URL
docker compose up -d
```

Open [https://distiq.8.229.88.229.sslip.io/sign-in](https://distiq.8.229.88.229.sslip.io/sign-in) and use one of the seeded demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | `test@mail.com` | `Test@mail.com` |
| Sales user | `user@mail.com` | `User@mail.com` |

> [!IMPORTANT]
> DistIQ uses simple email/password auth. Google OAuth is intentionally disabled. The Docker seed creates demo users plus sample B2B distribution CRM data automatically.

### What you get

| Service | Purpose | Exposed |
|---|---|---|
| `app` | DistIQ (Next.js standalone build) | `localhost:3002` behind Caddy on `:80` |
| `postgres` | PostgreSQL 17 with pgvector | internal only |
| `minio` | S3-compatible object storage | internal only |
| `inngest` | Background job runner | internal only |

Only `APP_PORT` is exposed to the host, defaulting to `3002` for the app when Caddy owns public port `80`. Everything else stays on the internal Docker network — secure by default. Uncomment the relevant `ports:` blocks in `docker-compose.yml` if you need direct access (e.g. for psql or the MinIO console).

### Configuring environment variables

You **never edit `Dockerfile` or `docker-compose.yml`** to add your secrets. Instead, create a `.env` file in the project root — Docker Compose reads it automatically and injects the values into the container.

```sh
cp .env.docker .env
nano .env       # set internal service passwords, auth secret, and optional API keys
docker compose up -d
```

> [!WARNING]
> The bundled Postgres and MinIO containers ship with a placeholder password (`changeme`) so the stack works on first run. The internal services are not exposed to the host network — only the app on `APP_PORT` is reachable — so this is safe for local experimentation. **For any deployment beyond your laptop**, set strong values for `POSTGRES_PASSWORD` and `MINIO_ROOT_PASSWORD` in your `.env` file before starting the stack.

The `.env.docker` file lists every supported variable with comments. Beyond the internal service passwords, you only need to add values for **optional external integrations** you want to enable:

```bash
# Example .env
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
APP_PORT=3002
PUBLIC_APP_URL=https://distiq.8.229.88.229.sslip.io
OPENAI_API_KEY=sk-your-real-key       # enables AI enrichment/generation
FIRECRAWL_API_KEY=fc-...              # enables web research enrichment
E2B_API_KEY=e2b_...                   # enables browser-agent enrichment
RESEND_API_KEY=re_...                 # enables campaigns/outbound email
```

`.env` is in `.gitignore`, so your secrets never get committed.

### Persistent data

Database and uploaded files persist across restarts via two named volumes:

- `postgres_data` — your database
- `minio_data` — uploaded files

```sh
docker compose down        # stops services, keeps data
docker compose down -v     # stops services AND wipes all data
```

### Updating to a new release

```sh
git pull
docker compose up -d --build
```

The entrypoint runs `prisma migrate deploy` on every start, so new schema changes are applied automatically. Reference data is seeded before the first user signs up.

### Coolify, Dokku, Portainer, etc.

This setup works out of the box with self-hosting platforms:

- **Coolify** — point it at this repo, choose "Docker Compose" build pack, set your env vars in Coolify's UI
- **Portainer / Dockge** — paste `docker-compose.yml` into a stack, add env vars in the UI

In all cases, env vars set through the platform UI override the placeholders in `docker-compose.yml` the same way a `.env` file does locally.

### First login

After first start, go to `/sign-in` and create the first account. That user becomes admin automatically. No email provider or OAuth app is required for login.

Use that OTP on the sign-in page. After login, configure an email provider from the Admin panel so future logins work normally.

## Contact

[www.dovhomilja.cz](https://www.dovhomilja.cz)
</br>
[<img alt="X (formerly Twitter) URL" src="https://img.shields.io/twitter/url?url=https%3A%2F%2Ftwitter.com%2Fdovhomilja">
](https://twitter.com/dovhomilja)

## Contributing

We are open to the DistIQ community contributions. Every contribution is welcome.

### Issues

- [Open an issue](https://github.com/pdovhomilja/distiq-app/issues) if you find a bug or have a suggestion for improvements.

### DistIQ Super heroes

<a href="https://github.com/pdovhomilja/distiq-app/graphs/contributors">
<img src="https://contrib.rocks/image?repo=pdovhomilja/distiq-app" />
</a>

Made with [contrib.rocks](https://contrib.rocks).

## Repo Activity

![Alt](https://repobeats.axiom.co/api/embed/e6bed6e15724f38c278ad2edcf0573a1bb24bed6.svg "Repobeats analytics image")

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=pdovhomilja/distiq-app&type=Timeline)](https://star-history.com/#pdovhomilja/distiq-app&Timeline)

## License

Licensed under the [MIT license](https://github.com/pdovhomilja/distiq-app/blob/main/LICENSE.md).
