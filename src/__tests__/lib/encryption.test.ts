import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// We need to set env vars before importing the module
const MOCK_KEY = "test-encryption-key-for-vitest-only";

describe("encryption", () => {
  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", MOCK_KEY);
    // Clear module cache so encryption.ts re-reads env
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("encrypt and decrypt round-trip produces original text", async () => {
    const { encrypt, decrypt } = await import("@/lib/encryption");
    const plaintext = "123456789";
    const encrypted = encrypt(plaintext);
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypted text has 3 parts separated by colons", async () => {
    const { encrypt } = await import("@/lib/encryption");
    const encrypted = encrypt("test-value");
    const parts = encrypted.split(":");
    expect(parts).toHaveLength(3);
  });

  it("encrypting same text twice produces different ciphertext (random IV)", async () => {
    const { encrypt } = await import("@/lib/encryption");
    const text = "sensitive-data";
    const enc1 = encrypt(text);
    const enc2 = encrypt(text);
    expect(enc1).not.toBe(enc2);
  });

  it("decrypt throws on invalid format", async () => {
    const { decrypt } = await import("@/lib/encryption");
    expect(() => decrypt("invalid-format")).toThrow("Invalid encrypted text format");
  });

  it("decrypt throws on tampered ciphertext", async () => {
    const { encrypt, decrypt } = await import("@/lib/encryption");
    const encrypted = encrypt("real-data");
    const parts = encrypted.split(":");
    parts[2] = "tampered" + parts[2];
    expect(() => decrypt(parts.join(":"))).toThrow();
  });

  it("encrypt throws when ENCRYPTION_KEY is missing", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    vi.resetModules();
    const { encrypt } = await import("@/lib/encryption");
    expect(() => encrypt("test")).toThrow("ENCRYPTION_KEY");
  });

  it("decrypt throws when ENCRYPTION_KEY is missing", async () => {
    vi.stubEnv("ENCRYPTION_KEY", "");
    vi.resetModules();
    const { decrypt } = await import("@/lib/encryption");
    expect(() => decrypt("a:b:c")).toThrow("ENCRYPTION_KEY");
  });
});
