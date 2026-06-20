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
| `inference` | 8791 | LLM inference proxy (Groq) |
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

## Groq Inference

HALA uses Groq as the direct LLM provider (bypassing OpenRouter).

Set in `ee/apps/inference/.env`:
```env
OPENROUTER_UPSTREAM_URL=https://api.groq.com/openai/v1
```

The provider key stored in the DB must be your Groq API key. Model aliases are defined in
`ee/apps/inference/src/model-catalog.ts` — see `hala-models.md` for the recommended Groq model list.

**Recommended Groq models for HALA:**

| Alias | Groq Model ID | Use case |
|---|---|---|
| `fast` | `llama-3.3-70b-versatile` | General tasks |
| `code` | `llama-3.1-70b-versatile` | Code-heavy workflows |
| `quick` | `llama3-8b-8192` | Simple/fast tasks |

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
