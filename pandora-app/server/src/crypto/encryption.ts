import nacl from 'tweetnacl';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { logger } from '../utils/logger';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16; // 128-bit authentication tag

/**
 * Encryption Service - Handles all encryption operations for PANDORA
 * Uses TweetNaCl (libsodium) for message encryption and AES-256-GCM for file encryption
 */
export class EncryptionService {
  /**
   * Generate a random 32-byte workspace encryption key (base64 encoded)
   * @returns Base64 encoded encryption key
   */
  static generateWorkspaceKey(): string {
    const key = nacl.randomBytes(32);
    return Buffer.from(key).toString('base64');
  }

  /**
   * Encrypt message using workspace key (XSalsa20-Poly1305 via TweetNaCl)
   * @param plaintext - Plain text message
   * @param workspaceKeyBase64 - Base64 encoded workspace key
   * @returns Object with ciphertext and nonce (both base64 encoded)
   */
  static encryptMessage(plaintext: string, workspaceKeyBase64: string): { ciphertext: string; nonce: string } {
    try {
      const key = Buffer.from(workspaceKeyBase64, 'base64');
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);
      const messageBytes = Buffer.from(plaintext, 'utf-8');

      // Use TweetNaCl's secretbox (XSalsa20 + Poly1305)
      const encrypted = nacl.secretbox(messageBytes, nonce, key);

      return {
        ciphertext: Buffer.from(encrypted).toString('base64'),
        nonce: Buffer.from(nonce).toString('base64'),
      };
    } catch (error) {
      logger.error(`Error encrypting message: ${error}`);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message using workspace key
   * @param ciphertextBase64 - Base64 encoded ciphertext
   * @param nonceBase64 - Base64 encoded nonce
   * @param workspaceKeyBase64 - Base64 encoded workspace key
   * @returns Decrypted plain text message
   */
  static decryptMessage(ciphertextBase64: string, nonceBase64: string, workspaceKeyBase64: string): string {
    try {
      const key = Buffer.from(workspaceKeyBase64, 'base64');
      const nonce = Buffer.from(nonceBase64, 'base64');
      const ciphertext = Buffer.from(ciphertextBase64, 'base64');

      const decrypted = nacl.secretbox.open(ciphertext, nonce, key);

      if (!decrypted) {
        throw new Error('Decryption failed - invalid ciphertext or key');
      }

      return Buffer.from(decrypted).toString('utf-8');
    } catch (error) {
      logger.error(`Error decrypting message: ${error}`);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt file using AES-256-GCM
   * @param fileBuffer - File data as Buffer
   * @param workspaceKeyBase64 - Base64 encoded workspace key
   * @returns Object with encrypted data and nonce
   */
  static encryptFile(fileBuffer: Buffer, workspaceKeyBase64: string): { encryptedData: Buffer; nonce: string } {
    try {
      const key = Buffer.from(workspaceKeyBase64, 'base64');
      const iv = randomBytes(IV_LENGTH);

      const cipher = createCipheriv(ALGORITHM, key, iv);
      const encrypted = Buffer.concat([cipher.update(fileBuffer), cipher.final()]);
      const authTag = cipher.getAuthTag();

      // Prepend IV and auth tag to encrypted data
      const encryptedData = Buffer.concat([iv, authTag, encrypted]);

      return {
        encryptedData,
        nonce: iv.toString('base64'),
      };
    } catch (error) {
      logger.error(`Error encrypting file: ${error}`);
      throw new Error('Failed to encrypt file');
    }
  }

  /**
   * Decrypt file using AES-256-GCM
   * @param encryptedData - Encrypted file data with IV and auth tag prepended
   * @param workspaceKeyBase64 - Base64 encoded workspace key
   * @returns Decrypted file data as Buffer
   */
  static decryptFile(encryptedData: Buffer, workspaceKeyBase64: string): Buffer {
    try {
      const key = Buffer.from(workspaceKeyBase64, 'base64');

      // Extract IV (first 12 bytes), auth tag (next 16 bytes), and ciphertext (rest)
      const iv = encryptedData.slice(0, IV_LENGTH);
      const authTag = encryptedData.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
      const ciphertext = encryptedData.slice(IV_LENGTH + TAG_LENGTH);

      const decipher = createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

      return decrypted;
    } catch (error) {
      logger.error(`Error decrypting file: ${error}`);
      throw new Error('Failed to decrypt file');
    }
  }

  /**
   * Generate a public/private key pair for E2EE (future use)
   * @returns Object with base64 encoded private and public keys
   */
  static generateKeyPair(): { privateKey: string; publicKey: string } {
    const keyPair = nacl.box.keyPair();
    return {
      privateKey: Buffer.from(keyPair.secretKey).toString('base64'),
      publicKey: Buffer.from(keyPair.publicKey).toString('base64'),
    };
  }
}

export const encryptionService = EncryptionService;
