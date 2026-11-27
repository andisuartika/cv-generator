/** Server only. AI features stay off until every required value is set. */
export type AiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  /** Shown to users before they send anything. */
  providerName: string;
  dailyLimitPerClient: number;
  dailyLimitTotal: number;
};

const positive = (value: string | undefined, fallback: number) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

export function getAiConfig(env: Record<string, string | undefined> = process.env): AiConfig | null {
  const baseUrl = env.AI_BASE_URL?.trim().replace(/\/+$/, "");
  const apiKey = env.AI_API_KEY?.trim();
  const model = env.AI_MODEL?.trim();
  const providerName = env.AI_PROVIDER_NAME?.trim();
  if (!baseUrl || !apiKey || !model || !providerName) return null;
  return {
    baseUrl,
    apiKey,
    model,
    providerName,
    dailyLimitPerClient: positive(env.AI_DAILY_LIMIT_PER_CLIENT, 5),
    dailyLimitTotal: positive(env.AI_DAILY_LIMIT_TOTAL, 100),
  };
}
