import crypto from "node:crypto";

/**
 * Admin security primitives: password hashing, random tokens, TOTP (RFC 6238),
 * and recovery codes. Uses only Node built-ins + the verified `bcryptjs` (pure
 * JS, no native build issues on Windows) for password hashing.
 */
import bcrypt from "bcryptjs";

const PASSWORD_COST = 12;

// ----- Passwords -----------------------------------------------------------
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, PASSWORD_COST);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export function passwordIsStrong(pw: string): boolean {
  return (
    pw.length >= 10 &&
    /[a-z]/.test(pw) &&
    /[A-Z]/.test(pw) &&
    /\d/.test(pw) &&
    /[^A-Za-z0-9]/.test(pw)
  );
}

// ----- Random tokens -------------------------------------------------------
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString("hex");
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

// ----- TOTP (RFC 6238, HMAC-SHA1, 6 digits, 30s step) ----------------------
function base32Decode(input: string): Buffer {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = input.replace(/[^A-Za-z2-7]/g, "").toUpperCase();
  let bits = "";
  for (const c of cleaned) {
    const idx = alphabet.indexOf(c);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const bytes = crypto.randomBytes(20);
  let secret = "";
  for (const b of bytes) secret += alphabet[b % 32];
  return secret;
}

export function totpCode(secret: string, timeStep = Math.floor(Date.now() / 30000), digits = 6): string {
  const key = base32Decode(secret);
  const counter = Buffer.alloc(8);
  counter.writeBigInt64BE(BigInt(timeStep));
  const hmac = crypto.createHmac("sha1", key).update(counter).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return (code % 10 ** digits).toString().padStart(digits, "0");
}

export function verifyTotp(secret: string, code: string): boolean {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const now = Math.floor(Date.now() / 30000);
  // Allow a ±1 step window for clock drift.
  for (const step of [now, now - 1, now + 1]) {
    if (totpCode(secret, step) === clean) return true;
  }
  return false;
}

export function otpauthUrl(secret: string, account: string, issuer: string): string {
  const label = encodeURIComponent(issuer + ":" + account);
  const params = new URLSearchParams({
    secret: secret.replace(/=+$/, ""),
    issuer,
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// ----- Recovery codes ------------------------------------------------------
export function generateRecoveryCodes(count = 10): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString("hex").toUpperCase().replace(/(.{4})/g, "$1-").slice(0, 8),
  );
}

export function hashRecoveryCode(code: string): string {
  return sha256(code.toUpperCase().replace(/-/g, ""));
}

/** Constant-time compare for secret tokens. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}
