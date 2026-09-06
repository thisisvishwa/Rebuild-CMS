import crypto from "node:crypto";

/**
 * Credential encryption at rest (§33, §72).
 *
 * Admin-managed credentials (payment keys/secrets, email/SMTP, third-party API
 * keys) are stored encrypted in the database, never in plaintext, so a DB leak
 * does not expose secrets. The encryption key is derived from an environment
 * variable (`ADMIN_CREDENTIALS_KEY`) with a fallback derived from the app's
 * access-token secret. Never log or expose these values to the client.
 *
 * Scheme: AES-256-GCM with a random 12-byte IV per value.
 * Stored format: `v1:<ivBase64>:<tagBase64>:<ciphertextBase64>`
 */

function resolveKey(): Buffer {
  const env = process.env.ADMIN_CREDENTIALS_KEY;
  if (env && env.trim().length >= 16) {
    return crypto.createHash("sha256").update(env.trim()).digest();
  }
  // Derive from the app secret as a development-safe default. In production set
  // ADMIN_CREDENTIALS_KEY to a long, random value so this branch is never used.
  const base = process.env.ACCESS_TOKEN_SECRET ?? "insecure-development-secret-change-me";
  return crypto.createHash("sha256").update(base + ":adbin-creds").digest();
}

export function encryptSecret(plaintext: string): string {
  const key = resolveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

export function decryptSecret(stored: string): string {
  const key = resolveKey();
  const [ver, ivB64, tagB64, dataB64] = stored.split(":");
  if (ver !== "v1" || !ivB64 || !tagB64 || !dataB64) {
    throw new Error("Invalid encrypted payload");
  }
  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const data = Buffer.from(dataB64, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

/** Whether a stored value looks encrypted (matches our v1 envelope). */
export function isEncrypted(value: string | null | undefined): boolean {
  return !!value && value.startsWith("v1:");
}
