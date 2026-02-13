/**
 * Graceful degradation helpers for external service calls
 */
export async function nonBlocking<T>(
  fn: () => Promise<T>,
  fallback: T,
  label = 'external'
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[${label}] Non-blocking call failed:`, err instanceof Error ? err.message : err);
    return fallback;
  }
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  label = 'external'
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}
