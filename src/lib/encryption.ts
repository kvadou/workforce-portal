import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "";
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts sensitive data using AES-256-GCM
 * @param text - The plaintext to encrypt
 * @returns The encrypted text in format: iv:authTag:ciphertext (all base64)
 */
export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // Create a 32-byte key from the environment variable
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);

  // Generate a random IV
  const iv = crypto.randomBytes(IV_LENGTH);

  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  // Encrypt the text
  let encrypted = cipher.update(text, "utf8", "base64");
  encrypted += cipher.final("base64");

  // Get the auth tag
  const authTag = cipher.getAuthTag();

  // Return iv:authTag:ciphertext
  return `${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted}`;
}

/**
 * Decrypts data encrypted with the encrypt function
 * @param encryptedText - The encrypted text in format: iv:authTag:ciphertext
 * @returns The decrypted plaintext
 */
export function decrypt(encryptedText: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // Parse the encrypted text
  const parts = encryptedText.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(parts[0], "base64");
  const authTag = Buffer.from(parts[1], "base64");
  const ciphertext = parts[2];

  // Create a 32-byte key from the environment variable
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);

  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  // Decrypt the text
  let decrypted = decipher.update(ciphertext, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Masks a tax ID for display (e.g., "XXX-XX-1234")
 * @param taxId - The full tax ID
 * @param type - Either "ssn" or "ein"
 * @returns The masked tax ID
 */
export function maskTaxId(taxId: string, type: "ssn" | "ein"): string {
  const digits = taxId.replace(/\D/g, "");
  if (type === "ssn") {
    return `XXX-XX-${digits.slice(-4)}`;
  }
  return `XX-XXX${digits.slice(-4)}`;
}
