import { RateLimiterMemory } from 'rate-limiter-flexible';

const limiter = new RateLimiterMemory({ points: 10, duration: 1 }); // 10 req/sec per key

export async function limitByIp(ip: string) {
  try {
    await limiter.consume(ip);
    return { allowed: true } as const;
  } catch {
    return { allowed: false } as const;
  }
}


