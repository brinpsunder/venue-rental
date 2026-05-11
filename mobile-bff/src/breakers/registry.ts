import CircuitBreaker from 'opossum';

/**
 * Centralni register odklopnikov (Circuit Breaker pattern).
 * Glej web-bff/src/breakers/registry.ts za podrobnosti.
 */

const registry: Record<string, CircuitBreaker> = {};

const defaultOpts: CircuitBreaker.Options = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
  volumeThreshold: 3,
};

export function makeBreaker<TArgs extends unknown[], TRet>(
  name: string,
  fn: (...args: TArgs) => Promise<TRet>,
  fallback?: (...args: TArgs) => TRet | Promise<TRet>,
): CircuitBreaker<TArgs, TRet> {
  const breaker = new CircuitBreaker<TArgs, TRet>(fn, { ...defaultOpts, name });
  if (fallback) breaker.fallback(fallback as never);
  breaker.on('open', () => console.warn(`[breaker] ${name} OPEN`));
  breaker.on('halfOpen', () => console.info(`[breaker] ${name} HALF_OPEN`));
  breaker.on('close', () => console.info(`[breaker] ${name} CLOSED`));
  breaker.on('reject', () => console.warn(`[breaker] ${name} rejected (open)`));
  breaker.on('timeout', () => console.warn(`[breaker] ${name} timeout`));
  registry[name] = breaker as unknown as CircuitBreaker;
  return breaker;
}

export function snapshot() {
  return Object.entries(registry).map(([name, b]) => ({
    name,
    state: b.opened ? 'open' : b.halfOpen ? 'half-open' : 'closed',
    stats: {
      fires: b.stats.fires,
      successes: b.stats.successes,
      failures: b.stats.failures,
      rejects: b.stats.rejects,
      timeouts: b.stats.timeouts,
      fallbacks: b.stats.fallbacks,
    },
  }));
}
