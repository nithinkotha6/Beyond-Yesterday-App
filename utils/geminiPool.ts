import { createGoogleGenerativeAI } from '@ai-sdk/google';

export class AllKeysExhaustedError extends Error {
  constructor(message?: string) {
    super(message || 'All Gemini API keys in the rotation pool have been exhausted.');
    this.name = 'AllKeysExhaustedError';
  }
}

export async function executeWithKeyRotation<T>(
  fn: (provider: ReturnType<typeof createGoogleGenerativeAI>) => Promise<T>
): Promise<T> {
  const keysStr = process.env.GEMINI_API_KEYS || '';
  let keys = keysStr.split(',').map((k) => k.trim()).filter(Boolean);

  if (keys.length === 0) {
    // Fallback to standard single key environment variables
    const fallbackKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
    if (fallbackKey) {
      keys = [fallbackKey];
    }
  }

  if (keys.length === 0) {
    throw new Error('No Gemini API keys found in environment variables.');
  }

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const provider = createGoogleGenerativeAI({ apiKey: key });

    try {
      return await fn(provider);
    } catch (err) {
      const errStr = String(err);
      const isRateLimit = 
        errStr.includes('429') || 
        errStr.includes('RESOURCE_EXHAUSTED') || 
        errStr.includes('Quota exceeded') ||
        (err && typeof err === 'object' && ('status' in err && (err as any).status === 429));

      if (isRateLimit && i < keys.length - 1) {
        console.warn(`[geminiPool] Key index ${i} rate-limited or quota exceeded. Rotating to next key...`);
        continue;
      }
      
      if (isRateLimit) {
        throw new AllKeysExhaustedError();
      }
      throw err;
    }
  }

  throw new AllKeysExhaustedError();
}
