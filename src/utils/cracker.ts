import CryptoJS from "crypto-js";

/**
 * Simulates a dictionary attack.
 */
export const dictionaryAttack = async (
  targetHash: string,
  salt: string,
  wordlist: string[],
  onProgress?: (index: number) => void
): Promise<string | null> => {
  for (let i = 0; i < wordlist.length; i++) {
    const word = wordlist[i];
    const hash = CryptoJS.SHA256(word + salt).toString();
    if (hash === targetHash) return word;
    if (i % 100 === 0) onProgress?.(i);
    // Yield to main thread
    if (i % 500 === 0) await new Promise((r) => setTimeout(r, 0));
  }
  return null;
};

/**
 * Simulates a brute force attack (limited for demo).
 */
export const bruteForceAttack = async (
  targetHash: string,
  salt: string,
  maxLength: number = 4,
  onProgress?: (count: number) => void
): Promise<string | null> => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let count = 0;

  const solve = async (current: string): Promise<string | null> => {
    if (current.length > maxLength) return null;
    if (current.length > 0) {
      const hash = CryptoJS.SHA256(current + salt).toString();
      count++;
      if (count % 1000 === 0) onProgress?.(count);
      if (count % 5000 === 0) await new Promise((r) => setTimeout(r, 0));
      if (hash === targetHash) return current;
    }

    if (current.length < maxLength) {
      for (const char of chars) {
        const result = await solve(current + char);
        if (result) return result;
      }
    }
    return null;
  };

  return solve("");
};
