# /brand — Apply HALA branding

Rename all user-facing "OpenWork" references to "HALA" throughout the codebase.

## What to change

1. **App title / window title**
   - Files: `apps/desktop/src-tauri/tauri.conf.json`, `apps/app/index.html`
   - `"OpenWork"` → `"HALA"`
   - `productName`, `identifier`, `bundle.identifier`: `openwork` → `hala`

2. **UI strings and i18n**
   - Files: `apps/app/src/**/*.{ts,tsx}`, `apps/app/src/i18n/**`
   - User-facing strings: `"OpenWork"` → `"HALA"`
   - Keep internal code identifiers (variable names, import paths, package names) unchanged

3. **MCP quick-connect display names**
   - File: `apps/app/src/app/constants.ts`
   - `"openwork-cloud"` display name → `"HALA Cloud"`
   - `"openwork-ui"` display name → `"HALA UI"`

4. **Model display names**
   - File: `packages/types/src/den/inference.ts`
   - Already updated — all start with `"HALA:"`. Do not change.

5. **Den web UI** (enterprise web app)
   - Files: `ee/apps/den-web/**/*.{ts,tsx}`
   - Page titles, nav labels, login page heading: `"OpenWork"` → `"HALA"`
   - Do not rename CSS classes, package names, or internal route paths

6. **Landing / email copy**
   - File: `ee/apps/landing/**`
   - Replace `"OpenWork"` with `"HALA"` in user-facing copy only

## What NOT to change

- Package names in `package.json` (`@openwork/*`, `openwork-*`)
- Import paths and module identifiers
- Internal variable/function names in non-UI code
- URL paths and API route strings
- `OPENWORK_DEV_MODE` env var name
- Anything inside `node_modules/`

## After making changes

```bash
pnpm typecheck
git add -p
git commit -m "chore(hala): apply HALA branding"
git push origin hala
```
