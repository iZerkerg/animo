const timingEnabled = process.env.NODE_ENV !== "production";

export async function withDevTiming<T>(label: string, operation: () => Promise<T>): Promise<T> {
  if (!timingEnabled) return operation();

  const startedAt = performance.now();
  try {
    return await operation();
  } finally {
    const elapsed = performance.now() - startedAt;
    console.info(`[timing] ${label}: ${elapsed.toFixed(1)} ms`);
  }
}

export function logDevTiming(label: string, startedAt: number) {
  if (!timingEnabled) return;
  console.info(`[timing] ${label}: ${(performance.now() - startedAt).toFixed(1)} ms`);
}
