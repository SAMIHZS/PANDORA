import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

/**
 * Crypto Service - Handles client-side encryption/decryption
 * Uses TweetNaCl for E2EE messaging
 */
export class CryptoService {
  /**
   * Encrypt message using workspace key
   */
  static encryptMessage(plaintext: string, workspaceKeyBase64: string): {
    ciphertext: string;
    nonce: string;
  } {
    try {
      const key = decodeBase64(workspaceKeyBase64);
      const plaintextBytes = encodeUTF8(plaintext);
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

      const encrypted = nacl.secretbox(plaintextBytes, nonce, key);

      if (!encrypted) {
        throw new Error('Encryption failed');
      }

      return {
        ciphertext: encodeBase64(encrypted),
        nonce: encodeBase64(nonce),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message
   */
  static decryptMessage(
    ciphertextBase64: string,
    nonceBase64: string,
    workspaceKeyBase64: string
  ): string {
    try {
      const key = decodeBase64(workspaceKeyBase64);
      const ciphertext = decodeBase64(ciphertextBase64);
      const nonce = decodeBase64(nonceBase64);

      const decrypted = nacl.secretbox.open(ciphertext, nonce, key);

      if (!decrypted) {
        throw new Error('Decryption failed - invalid ciphertext or key');
      }

      return decodeUTF8(decrypted);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Encrypt file (for client-side encryption before upload)
   * Note: For large files, consider using Web Crypto API or streaming
   */
  static async encryptFile(
    file: File,
    workspaceKeyBase64: string
  ): Promise<{ encryptedData: ArrayBuffer; nonce: string }> {
    try {
      const key = decodeBase64(workspaceKeyBase64);
      const fileBuffer = await file.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);
      const nonce = nacl.randomBytes(nacl.secretbox.nonceLength);

      const encrypted = nacl.secretbox(fileBytes, nonce, key);

      if (!encrypted) {
        throw new Error('File encryption failed');
      }

      return {
        encryptedData: encrypted.buffer,
        nonce: encodeBase64(nonce),
      };
    } catch (error) {
      console.error('File encryption error:', error);
      throw new Error('Failed to encrypt file');
    }
  }
}

export default CryptoService;
