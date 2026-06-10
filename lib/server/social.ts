// Server-only helpers for social OAuth: token encryption at rest + signed,
// expiring state/deposit tokens. Imported only by Node API routes (it reads
// process.env.SOCIAL_CRYPTO_KEY), so it never ends up in the client bundle. The
// browser only ever sees ciphertext (v1:...) and signed payloads it cannot forge.
const enc = new TextEncoder();
const dec = new TextDecoder();

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://appolyn.vercel.app';

function b64urlEncode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64url');
}

function b64urlDecode(s: string): Uint8Array {
  return new Uint8Array(Buffer.from(s, 'base64url'));
}

function secret(): string {
  const s = process.env.SOCIAL_CRYPTO_KEY;
  if (!s) throw new Error('SOCIAL_CRYPTO_KEY is not set');
  return s;
}

async function deriveKey(salt: string, info: string, algo: 'AES-GCM' | 'HMAC', usages: KeyUsage[]): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey('raw', enc.encode(secret()), 'HKDF', false, ['deriveKey']);
  const params = algo === 'AES-GCM'
    ? { name: 'AES-GCM' as const, length: 256 }
    : { name: 'HMAC' as const, hash: 'SHA-256', length: 256 };
  return crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: enc.encode(salt), info: enc.encode(info) },
    base, params, false, usages,
  );
}

// ── Token encryption (AES-256-GCM) ──────────────────────────────────────────
export async function encryptToken(plain: string): Promise<string> {
  if (!plain) return '';
  const key = await deriveKey('appolyn-social-tokens-v1', 'aes', 'AES-GCM', ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain)));
  const combined = new Uint8Array(iv.length + ct.length);
  combined.set(iv, 0);
  combined.set(ct, iv.length);
  return 'v1:' + b64urlEncode(combined);
}

export async function decryptToken(stored: string): Promise<string> {
  if (!stored) return '';
  if (!stored.startsWith('v1:')) return stored;
  const key = await deriveKey('appolyn-social-tokens-v1', 'aes', 'AES-GCM', ['encrypt', 'decrypt']);
  const raw = b64urlDecode(stored.slice(3));
  const iv = raw.slice(0, 12);
  const data = raw.slice(12);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return dec.decode(pt);
}

// ── Signed payloads (HMAC) for OAuth state and the connect "deposit" ─────────
export async function signPayload(obj: Record<string, unknown>): Promise<string> {
  const body = b64urlEncode(enc.encode(JSON.stringify(obj)));
  const key = await deriveKey('appolyn-social-sign-v1', 'hmac', 'HMAC', ['sign', 'verify']);
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
  return body + '.' + b64urlEncode(sig);
}

export async function verifyPayload<T = Record<string, unknown>>(token: string): Promise<T | null> {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const key = await deriveKey('appolyn-social-sign-v1', 'hmac', 'HMAC', ['sign', 'verify']);
  const ok = await crypto.subtle.verify('HMAC', key, b64urlDecode(sig), enc.encode(body));
  if (!ok) return null;
  try {
    const obj = JSON.parse(dec.decode(b64urlDecode(body))) as T & { exp?: number };
    if (obj.exp && Date.now() > obj.exp) return null;
    return obj as T;
  } catch {
    return null;
  }
}
