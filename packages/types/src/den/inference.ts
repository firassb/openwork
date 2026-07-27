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

// upstreamModel values use Groq model IDs.
// Groq API reference: https://console.groq.com/docs/models
// OPENROUTER_UPSTREAM_URL must be set to https://api.groq.com/openai/v1

export const INFERENCE_MODEL_ALIASES = {
  // General-purpose — fast, high quality
  "groq/llama-3.3-70b-versatile": {
    upstreamModel: "llama-3.3-70b-versatile",
    displayName: "Llama 3.3 70B",
    enabled: true,
    usageFactor: 1,
  },
  // Code-heavy tasks
  "groq/llama-3.1-70b-versatile": {
    upstreamModel: "llama-3.1-70b-versatile",
    displayName: "Llama 3.1 70B",
    enabled: true,
    usageFactor: 1,
  },
  // Lightweight / fast responses
  "groq/llama3-8b-8192": {
    upstreamModel: "llama3-8b-8192",
    displayName: "Llama 3 8B (Fast)",
    enabled: true,
    usageFactor: 1,
  },
  // Low-latency instant responses
  "groq/llama-3.1-8b-instant": {
    upstreamModel: "llama-3.1-8b-instant",
    displayName: "Llama 3.1 8B Instant",
    enabled: true,
    usageFactor: 1,
  },
  // Multi-lingual + Arabic support
  "groq/mixtral-8x7b-32768": {
    upstreamModel: "mixtral-8x7b-32768",
    displayName: "Mixtral 8x7B",
    enabled: true,
    usageFactor: 1,
  },
} as const;

export type InferenceModelAlias = keyof typeof INFERENCE_MODEL_ALIASES;

export type InferenceOrganizationMetadata = {
  enabled: true;
  tier: InferenceTier;
};
