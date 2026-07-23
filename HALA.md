# OpenWork — HALA Internal Deployment

This branch (`hala`) contains HALA-specific configuration and deployment notes on top of the upstream OpenWork codebase.

> **Upstream:** [firassb/openwork @ dev](https://github.com/firassb/openwork/tree/dev)  
> **License:** Core is MIT. Enterprise features under `/ee/` are FSL-1.1-MIT (internal use permitted).

---

## Deployment Stack

HALA runs the full enterprise stack (`/ee/`) self-hosted on-premises using Docker Compose.

### Components

| Service | Port | Purpose |
|---|---|---|
| `den-api` | 8788 | REST API + Auth (SAML/SSO) |
| `den-web` | 3005 | Next.js web UI for staff |
| `den-worker-proxy` | 8789 | Agent worker management |
| `inference` | 8791 | LLM inference proxy (Groq deprecated — migrating to OCI) |
| `mysql` | 3306 | State database |

### Quick Start

```bash
# 1. Copy and fill in HALA env file
cp hala.env.example ee/apps/den-api/.env
cp hala-inference.env.example ee/apps/inference/.env

# 2. Generate secrets
openssl rand -base64 48   # → BETTER_AUTH_SECRET
openssl rand -base64 48   # → DEN_DB_ENCRYPTION_KEY

# 3. Start the stack
docker compose -f packaging/docker/docker-compose.den-dev.yml \
               -f packaging/docker/docker-compose.hala.yml up -d

# 4. Run DB migrations
docker exec -it den-api pnpm db:migrate
```

---

## Groq Inference (Deprecated)

> **Status: deprecated as of 2026-07-23.** The Groq partnership has ended and Groq is no
> longer a supplier for HALA. This section only ever applied to the self-hosted `ee/`
> enterprise stack (`ee/apps/inference`) — it has no bearing on running the desktop app
> locally, which uses Ollama instead (see [Local Development on macOS](#local-development-on-macos-apple-silicon-ollama)
> below).

Historically HALA used Groq as the direct LLM provider (bypassing OpenRouter), via
`OPENROUTER_UPSTREAM_URL=https://api.groq.com/openai/v1` in `ee/apps/inference/.env`. The
corresponding model aliases in `packages/types/src/den/inference.ts` are now all
`enabled: false` and kept only for reference — do not re-enable or issue new Groq keys.

**Former Groq models (now disabled):**

| Alias | Groq Model ID | Use case |
|---|---|---|
| `fast` | `llama-3.3-70b-versatile` | General tasks |
| `code` | `llama-3.1-70b-versatile` | Code-heavy workflows |
| `quick` | `llama3-8b-8192` | Simple/fast tasks |

---

## OCI Self-Hosted Inference (Planned)

HALA is deploying its own models on OCI GPUs to replace Groq for the self-hosted `ee/`
stack. This isn't live yet — the following config slots are reserved so the migration is a
drop-in once endpoint details exist:

- `packages/types/src/den/inference.ts` — `"oci/default"` alias in `INFERENCE_MODEL_ALIASES`
  (currently `enabled: false`, `upstreamModel: "TBD"`).
- `hala-inference.env.example` — commented-out `OCI_INFERENCE_UPSTREAM_URL` placeholder.

To activate: fill in the real upstream model ID(s) and endpoint URL in both places, flip the
relevant aliases to `enabled: true`, and point `OPENROUTER_UPSTREAM_URL` at the OCI endpoint.

---

## Local Development on macOS (Apple Silicon, Ollama)

While the OCI self-hosted stack is being stood up, use this fork locally on a Mac with
[Ollama](https://ollama.com) instead of the Groq/`ee/` enterprise stack. Ollama support is
already built into the desktop app — no extra wiring needed beyond installing the app and
pulling a model.

### Requirements
- Node.js + `pnpm`, Rust toolchain, Xcode Command Line Tools, `opencode` CLI on PATH — see
  the main `README.md` "Quick start" section for full prerequisites.
- Ollama app installed and running (`ollama serve`, or just launch the app).

### Model sizing for 18GB unified memory (e.g. MacBook Pro M3, 18GB)
Stick to 7B–8B quantized (q4) models — they use roughly 4–5GB and leave headroom for macOS
and the app itself. The desktop app's default, `qwen2.5-coder:7b`, is a good fit. Avoid
14B+ models and unquantized or 70B models (like the former Groq `llama-3.3-70b-versatile`) —
they won't fit comfortably in 18GB alongside everything else running on the machine.

```bash
ollama pull qwen2.5-coder:7b
```

### Run the app
```bash
pnpm install
pnpm dev       # desktop app
# or: pnpm dev:ui   # web UI only
```

### Wire up Ollama
In the app, go to **Settings → Extensions → Ollama**. It auto-detects a running local
Ollama server at `http://localhost:11434`, lists any models you've already pulled, and lets
you pull new ones. Click **Add to workspace** — "Use as default model in workspace" is
pre-checked, so this single click makes Ollama the default provider for the workspace. No
manual `opencode.json` editing or `ee/` stack setup required for this path.

---

## Azure AD SSO (SAML 2.0)

### Azure AD Side (IT Admin)

1. Go to **Azure Active Directory → Enterprise Applications → New Application → Create your own**
2. Name it `OpenWork_HALA`
3. Select **"Integrate any other application you don't find in the gallery (Non-gallery)"**
4. Go to **Single sign-on → SAML**
5. Set:
   - **Entity ID (Identifier):** `https://openwork.hala.com` *(your internal domain)*
   - **Reply URL (ACS):** `https://openwork.hala.com/api/auth/sso/saml/callback`
   - **Sign on URL:** `https://openwork.hala.com/sso/<your-org-slug>`
6. Under **Attributes & Claims**, ensure these are mapped:
   - `emailaddress` → `user.mail`
   - `givenname` → `user.givenname`
   - `surname` → `user.surname`
   - `name` → `user.userprincipalname`
7. Download the **Federation Metadata XML** — you need this for step below.

### OpenWork Side (DevOps)

1. In the den-api DB, insert a row into `SsoProviderTable` with:
   - `domain`: your email domain (e.g. `hala.com`)
   - `metadata_url` or `metadata_xml`: paste/link the Azure AD Federation Metadata XML
   - `enabled`: `true`
2. Staff navigate to `https://openwork.hala.com/sso/<org-slug>` and are redirected to Azure AD login.
3. On first login, OpenWork provisions the user account automatically.

### Group → Role Mapping (optional, via SCIM)

If you want Azure AD groups to map to OpenWork org roles:
1. In the Azure AD enterprise app, go to **Provisioning → Automatic**
2. Set **Tenant URL** to `https://openwork.hala.com/api/scim/v2`
3. Generate a SCIM token in OpenWork admin panel → paste as **Secret Token**
4. Map group `OpenWork-Admins` → role `admin`, `OpenWork-Members` → role `member`

---

## Security Notes (SAMA Compliance)

- All services bind to internal network only — do **not** expose MySQL or inference ports externally.
- `DEN_DB_ENCRYPTION_KEY` must be stored in your secrets manager (Azure Key Vault recommended), not in `.env` files on disk.
- Rotate `BETTER_AUTH_SECRET` and `DEN_DB_ENCRYPTION_KEY` on a schedule aligned with your SAMA CSF policy.
- OpenWork does not send telemetry when self-hosted. Confirm with `OPENWORK_DEV_MODE=0`.
- Audit logs: OpenWork session events are stored in MySQL — retain per your SAMA data retention policy.
- Do **not** process customer PII or regulated data in agent sessions without completing a formal data classification review.

---

## Keeping in Sync with Upstream

```bash
# Fetch upstream changes into this branch
git fetch origin dev
git merge origin/dev --no-ff -m "chore: sync upstream dev into hala"
# Resolve any conflicts in HALA-specific files, then push
git push origin hala
```

HALA-specific files (never overwrite on merge):
- `HALA.md`
- `hala.env.example`
- `hala-inference.env.example`
- `packaging/docker/docker-compose.hala.yml`
