/**
 * Safe client-side obfuscation / hashing for PIN lock
 * Never stores plain visible text in localStorage
 */

export function hashPin(pin: string): string {
  if (!pin) return '';
  let hash1 = 5381;
  let hash2 = 52711;
  const salted = `ZZ_KHATA_SECURE_${pin}_PAKISTAN_2026`;

  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash1 = ((hash1 << 5) + hash1) ^ char;
    hash2 = ((hash2 << 5) + hash2) ^ (char * 31);
  }

  const combined = `${Math.abs(hash1).toString(36)}_${Math.abs(hash2).toString(36)}_${pin.length}`;
  return btoa(combined);
}

export function verifyPin(enteredPin: string, storedHash: string): boolean {
  if (!enteredPin || !storedHash) return false;
  return hashPin(enteredPin) === storedHash;
}
