// Server-side encryption utilities for API keys
import { cookies } from 'next/headers';
import crypto from 'crypto';

// Use the same key as client-side encryption
// IMPORTANT: Must match NEXT_PUBLIC_ENCRYPTION_KEY used in client
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-encryption-key-change-me';
if (process.env.NODE_ENV === 'production' && ENCRYPTION_KEY === 'default-encryption-key-change-me') {
  console.warn('WARNING: Using default encryption key in production. Please set a secure NEXT_PUBLIC_ENCRYPTION_KEY environment variable.');
}

export async function encryptApiKey(apiKey: string): Promise<string> {
  // Ensure the key is 32 bytes for aes-256-gcm
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  // Use a random 12-byte IV for each encryption
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // Encrypt the data and get the result as a buffer
  const encrypted = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()]);

  // Get the 16-byte auth tag
  const authTag = cipher.getAuthTag();

  // Prepend IV and append auth tag to the encrypted data buffer, then encode as a single base64 string
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString('base64');
}

export async function decryptApiKey(encryptedKey: string): Promise<string> {
  try {
    // Decode base64 to buffer
    const combined = Buffer.from(encryptedKey, 'base64');

    // Extract IV (first 12 bytes) and encrypted data with authTag (remaining bytes)
    const iv = combined.slice(0, 12);
    // Web Crypto API includes the 16-byte auth tag at the end of the ciphertext
    const encryptedData = combined.slice(12);

    // Split encrypted data and auth tag
    const authTag = encryptedData.slice(-16);
    const ciphertext = encryptedData.slice(0, -16);

    // Create key from ENCRYPTION_KEY
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv) as crypto.DecipherGCM;
    decipher.setAuthTag(authTag);

    // Decrypt
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

export async function getApiKeys() {
  const cookieStore = await cookies();

  const keys = {
    openaiApiKey: '',
    anthropicApiKey: '',
    geminiApiKey: '',
    youtubeApiKey: '',
    googleSearchApiKey: '',
    googleSearchEngineId: '',
  };

  try {
    // Get all cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log('All cookies available:', allCookies.map(c => c.name));

    // Try to get from cookies first
    const encryptedOpenAI = cookieStore.get('encrypted_openai_key')?.value;
    const encryptedAnthropic = cookieStore.get('encrypted_anthropic_key')?.value;
    const encryptedGemini = cookieStore.get('encrypted_gemini_key')?.value;
    const encryptedYoutube = cookieStore.get('encrypted_youtube_key')?.value;
    const encryptedGoogleSearch = cookieStore.get('encrypted_google_search_key')?.value;
    const encryptedSearchEngineId = cookieStore.get('encrypted_google_search_engine_id')?.value;

    console.log('Encrypted cookies found:', {
      openai: !!encryptedOpenAI,
      anthropic: !!encryptedAnthropic,
      gemini: !!encryptedGemini,
      youtube: !!encryptedYoutube,
      googleSearch: !!encryptedGoogleSearch,
      searchEngineId: !!encryptedSearchEngineId,
    });

    // Decrypt keys from cookies if they exist.
    // No fallback to environment variables.
    if (encryptedOpenAI) {
      console.log('Decrypting OpenAI key...');
      keys.openaiApiKey = await decryptApiKey(encryptedOpenAI);
      console.log('OpenAI key decrypted successfully');
    }

    if (encryptedAnthropic) {
      console.log('Decrypting Anthropic key...');
      keys.anthropicApiKey = await decryptApiKey(encryptedAnthropic);
      console.log('Anthropic key decrypted successfully');
    }

    if (encryptedGemini) {
      console.log('Decrypting Gemini key...');
      keys.geminiApiKey = await decryptApiKey(encryptedGemini);
      console.log('Gemini key decrypted successfully');
    }

    if (encryptedYoutube) {
      console.log('Decrypting YouTube key...');
      keys.youtubeApiKey = await decryptApiKey(encryptedYoutube);
      console.log('YouTube key decrypted successfully');
    }

    if (encryptedGoogleSearch) {
      console.log('Decrypting Google Search key...');
      keys.googleSearchApiKey = await decryptApiKey(encryptedGoogleSearch);
      console.log('Google Search key decrypted successfully');
    }

    if (encryptedSearchEngineId) {
      console.log('Decrypting Search Engine ID...');
      keys.googleSearchEngineId = await decryptApiKey(encryptedSearchEngineId);
      console.log('Search Engine ID decrypted successfully');
    }
  } catch (error) {
    console.error('Error getting API keys:', error);
    // If any decryption fails, we should not proceed with potentially missing keys.
    // Re-throwing the error makes the failure explicit.
    throw new Error('Failed to retrieve and decrypt one or more API keys from cookies.');
  }

  return keys;
}
