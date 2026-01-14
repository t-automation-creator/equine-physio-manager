/**
 * Retry a function with exponential backoff and jitter
 * Useful for handling transient errors like rate limits (429) or server errors (500, 503)
 */

interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

interface RetryableError extends Error {
  status?: number;
}

/**
 * Retries an async function with exponential backoff
 * @param fn - The async function to retry
 * @param options - Retry configuration
 * @returns The result of the function
 * @throws The last error if all retries fail
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxRetries,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    retryableStatuses,
  } = options;

  let lastError: RetryableError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt the function
      const result = await fn();

      // Success! Log and return
      if (attempt > 0) {
        console.log(`[Retry] Success on attempt ${attempt + 1}/${maxRetries + 1}`);
      }

      return result;
    } catch (error) {
      lastError = error as RetryableError;

      // Check if this error is retryable
      const isRetryable = lastError.status && retryableStatuses.includes(lastError.status);

      // If not retryable or last attempt, throw immediately
      if (!isRetryable || attempt === maxRetries) {
        console.error(`[Retry] Failed after ${attempt + 1} attempts:`, lastError.message);
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );

      // Add jitter (±50% random variance) to prevent thundering herd
      const jitter = exponentialDelay * (0.5 + Math.random());
      const delayMs = Math.round(jitter);

      console.log(
        `[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed with status ${lastError.status}. ` +
        `Retrying in ${delayMs}ms...`
      );

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}
