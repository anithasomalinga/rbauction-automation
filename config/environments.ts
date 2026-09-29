export interface Environment {
  name: string;
  baseURL: string;
  /** Next.js locale segment used in /_next/data/{buildId}/{locale}/... routes */
  locale: string;
}

const environments = {
  prod: {
    name: 'prod',
    baseURL: 'https://www.rbauction.com',
    locale: 'en-US',
  },
  // Add further environments here, e.g.
  // staging: { name: 'staging', baseURL: 'https://staging.rbauction.com', locale: 'en-US' },
} satisfies Record<string, Environment>;

export type EnvironmentName = keyof typeof environments;

/**
 * Resolves the target environment from ENV (default: prod).
 * BASE_URL overrides the configured URL for ad-hoc runs.
 */
export function getEnvironment(name: string = process.env.ENV ?? 'prod'): Environment {
  if (!(name in environments)) {
    throw new Error(`Unknown ENV "${name}". Valid values: ${Object.keys(environments).join(', ')}`);
  }
  const env = environments[name as EnvironmentName];
  return { ...env, baseURL: process.env.BASE_URL ?? env.baseURL };
}
