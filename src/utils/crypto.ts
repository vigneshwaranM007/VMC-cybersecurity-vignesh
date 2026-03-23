import CryptoJS from "crypto-js";

/**
 * Generates a random salt.
 */
export const generateSalt = (length: number = 16): string => {
  return CryptoJS.lib.WordArray.random(length).toString();
};

/**
 * Hashes a password with a salt using SHA-256.
 */
export const hashPassword = (password: string, salt: string): string => {
  return CryptoJS.SHA256(password + salt).toString();
};

/**
 * Encrypts a message using AES with a passphrase.
 */
export const encryptMessage = (message: string, passphrase: string): string => {
  return CryptoJS.AES.encrypt(message, passphrase).toString();
};

/**
 * Decrypts a message using AES with a passphrase.
 */
export const decryptMessage = (ciphertext: string, passphrase: string): string => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, passphrase);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    return "";
  }
};
