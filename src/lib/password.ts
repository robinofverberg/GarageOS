import "server-only";

const ITERATIONS = 100_000;
const HASH_BITS = 256;
const SALT_BYTES = 16;

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer as ArrayBuffer;
}

async function deriveKey(
  password: string,
  salt: ArrayBuffer
): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  return crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS },
    key,
    HASH_BITS
  );
}

export async function hashPassword(password: string): Promise<string> {
  const saltBytes = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const salt = saltBytes.buffer as ArrayBuffer;
  const hash = await deriveKey(password, salt);
  return `${bufferToHex(salt)}:${bufferToHex(hash)}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const salt = hexToBuffer(saltHex);
  const hash = await deriveKey(password, salt);
  return bufferToHex(hash) === hashHex;
}
