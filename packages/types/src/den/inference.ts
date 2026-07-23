export const INFERENCE_USAGE_CONVERSION_FACTOR = 100_000_000;

export const INFERENCE_WINDOW_TYPES = [
  "five_hour",
  "weekly",
  "monthly",
] as const;
export type InferenceWindowType = (typeof INFERENCE_WINDOW_TYPES)[number];

export const INFERENCE_TIERS = ["tier1", "tier2"] as const;
export type InferenceTier = (typeof INFERENCE_TIERS)[number];

export const INFERENCE_TIER_LIMITS: Record<
  InferenceTier,
  Record<InferenceWindowType, number>
> = {
  tier1: {
    five_hour: 100_000_000,
    weekly: 500_000_000,
    monthly: 1_000_000_000,
  },
  tier2: {
    five_hour: 150_000_000,
    weekly: 750_000_000,
    monthly: 1_500_000_000,
  },
} as const;

export const INFERENCE_RESET_STRATEGIES = [
  "anchored",
  "activity_based",
] as const;
export type InferenceResetStrategy =
  (typeof INFERENCE_RESET_STRATEGIES)[number];

export const INFERENCE_RESET_STRATEGY_BY_WINDOW_TYPE: Record<
  InferenceWindowType,
  InferenceResetStrategy
> = {
  five_hour: "activity_based",
  weekly: "anchored",
  monthly: "anchored",
} as const;

export const INFERENCE_WINDOW_DURATIONS_MS: Record<
  InferenceWindowType,
  number
> = {
  five_hour: 5 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
} as const;

// HALA: Groq was our direct LLM provider but the partnership ended 2026-07-23
// and is no longer a supplier. Aliases below are kept (disabled) for historical
// reference only — do not route new traffic to Groq or re-enable these.
//
// HALA is migrating to self-hosted models on OCI GPUs; see the oci/* placeholder
// aliases below, which will be filled in with real upstream model IDs once that
// deployment is live.

export const INFERENCE_MODEL_ALIASES = {
  // General-purpose — fast, high quality
  "groq/llama-3.3-70b-versatile": {
    upstreamModel: "llama-3.3-70b-versatile",
    displayName: "HALA: Llama 3.3 70B",
    enabled: false,
    usageFactor: 1,
  },
  // Code-heavy tasks
  "groq/llama-3.1-70b-versatile": {
    upstreamModel: "llama-3.1-70b-versatile",
    displayName: "HALA: Llama 3.1 70B",
    enabled: false,
    usageFactor: 1,
  },
  // Lightweight / fast responses
  "groq/llama3-8b-8192": {
    upstreamModel: "llama3-8b-8192",
    displayName: "HALA: Llama 3 8B (Fast)",
    enabled: false,
    usageFactor: 1,
  },
  // Low-latency instant responses
  "groq/llama-3.1-8b-instant": {
    upstreamModel: "llama-3.1-8b-instant",
    displayName: "HALA: Llama 3.1 8B Instant",
    enabled: false,
    usageFactor: 1,
  },
  // Multi-lingual + Arabic support
  "groq/mixtral-8x7b-32768": {
    upstreamModel: "mixtral-8x7b-32768",
    displayName: "HALA: Mixtral 8x7B",
    enabled: false,
    usageFactor: 1,
  },
  // TODO(OCI): replace upstreamModel with the real self-hosted model ID once
  // the OCI GPU deployment is live, then flip enabled to true.
  "oci/default": {
    upstreamModel: "TBD",
    displayName: "HALA: OCI Self-Hosted (planned)",
    enabled: false,
    usageFactor: 1,
  },
} as const;

export type InferenceModelAlias = keyof typeof INFERENCE_MODEL_ALIASES;

export type InferenceOrganizationMetadata = {
  enabled: true;
  tier: InferenceTier;
};
