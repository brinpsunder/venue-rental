import CircuitBreaker from 'opossum';

/**
 * Centralni register odklopnikov (Circuit Breaker pattern).
 *
 * Vsak odhodni klic na drugo storitev ovijemo v CircuitBreaker. Ko stopnja
 * napak preseže prag, breaker preide v stanje OPEN in naslednji klici takoj
 * vrnejo fallback (degradiran odgovor) brez čakanja na timeout. Po
 * `resetTimeout` ms breaker preide v HALF_OPEN in dovoli en testni klic.
 */

type AnyAsync<TArgs extends unknown[], TRet> = (...args: TArgs) => Promise<TRet>;

const registry: Record<string, CircuitBreaker> = {};

const defaultOpts: CircuitBreaker.Options = {
  timeout: 3000,                  // klic, daljši od 3 s, šteje kot napaka
  errorThresholdPercentage: 50,   // pri >50% napak v "rolling" oknu se odpre
  resetTimeout: 10000,            // čakanje pred prehodom v HALF_OPEN
  rollingCountTimeout: 10000,
  rollingCountBuckets: 10,
  volumeThreshold: 3,             // potrebnih je vsaj 3 klicev v oknu
};

export function makeBreaker<TArgs extends unknown[], TRet>(
  name: string,
  fn: AnyAsync<TArgs, TRet>,
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
