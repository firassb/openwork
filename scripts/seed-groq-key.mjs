#!/usr/bin/env node
/**
 * One-time script to insert the Groq API key into MySQL for a given org.
 *
 * Usage:
 *   GROQ_API_KEY=gsk_xxx \
 *   ORGANIZATION_ID=org_xxx \
 *   DATABASE_URL=mysql://root:password@127.0.0.1:3306/openwork_den \
 *   DEN_DB_ENCRYPTION_KEY=your-32-char-key \
 *   node scripts/seed-groq-key.mjs
 */

import crypto from "node:crypto"
import mysql from "mysql2/promise"

// ── encryption (mirrors ee/packages/den-db/src/columns.ts) ──────────────────

function getDatabaseEncryptionKey() {
  const secret = process.env.DEN_DB_ENCRYPTION_KEY?.trim()
  if (!secret || secret.length < 32) {
    throw new Error("DEN_DB_ENCRYPTION_KEY must be at least 32 characters")
  }
  return new Uint8Array(crypto.createHash("sha256").update(secret).digest())
}

function encrypt(value) {
  const ivBuffer = crypto.randomBytes(12)
  const iv = new Uint8Array(ivBuffer)
  const cipher = crypto.createCipheriv("aes-256-gcm", getDatabaseEncryptionKey(), iv)
  let encrypted = cipher.update(value, "utf8", "base64")
  encrypted += cipher.final("base64")
  const authTag = cipher.getAuthTag().toString("base64")
  const ivBase64 = ivBuffer.toString("base64")
  return `enc:v1:${ivBase64}.${authTag}.${encrypted}`
}

// ── typeid (matches prefix "iopk" for inferenceOrgProviderKey) ───────────────

function generateId(prefix) {
  const bytes = crypto.randomBytes(16)
  const b64 = bytes.toString("base64url").replace(/=/g, "").slice(0, 26)
  return `${prefix}_${b64}`
}

// ── main ─────────────────────────────────────────────────────────────────────

const groqApiKey   = process.env.GROQ_API_KEY
const orgId        = process.env.ORGANIZATION_ID
const databaseUrl  = process.env.DATABASE_URL

if (!groqApiKey || !orgId || !databaseUrl) {
  console.error("Missing required env vars: GROQ_API_KEY, ORGANIZATION_ID, DATABASE_URL")
  process.exit(1)
}

const encryptedKey = encrypt(groqApiKey)
const id           = generateId("iopk")
const keyPrefix    = groqApiKey.slice(0, 8)
const now          = new Date().toISOString().slice(0, 19).replace("T", " ")

const conn = await mysql.createConnection(databaseUrl)

// Upsert: if a key for this org+provider already exists, update it
await conn.execute(
  `INSERT INTO inference_org_upstream_provider_keys
     (id, organization_id, provider, encrypted_api_key, key_prefix, status, created_at, updated_at)
   VALUES (?, ?, 'openrouter', ?, ?, 'active', ?, ?)
   ON DUPLICATE KEY UPDATE
     encrypted_api_key = VALUES(encrypted_api_key),
     key_prefix        = VALUES(key_prefix),
     status            = 'active',
     updated_at        = VALUES(updated_at)`,
  [id, orgId, encryptedKey, keyPrefix, now, now]
)

await conn.end()
console.log(`✓ Groq API key seeded for org ${orgId} (prefix: ${keyPrefix}...)`)
