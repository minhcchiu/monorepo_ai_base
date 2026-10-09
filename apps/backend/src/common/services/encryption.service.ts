import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger('EncryptionService');
  private readonly algorithm = 'aes-256-gcm';
  private readonly secretKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const rawKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      'cloudpulse_master_aes256_secret_key_32bytes!!';
    // Ensure key is exactly 32 bytes for AES-256
    this.secretKey = crypto.createHash('sha256').update(rawKey).digest();
  }

  /**
   * Encrypts a plain text string (e.g. password, private SSH key).
   * Returns format: `iv:authTag:encryptedText`
   */
  encrypt(text: string | null | undefined): string | null {
    if (!text) return null;
    // If text already matches encrypted format iv:authTag:data, do not double-encrypt
    if (this.isEncrypted(text)) return text;

    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(this.algorithm, this.secretKey, iv);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag().toString('hex');

      return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (err: any) {
      this.logger.error(`Encryption error: ${err.message}`);
      return text;
    }
  }

  /**
   * Decrypts an encrypted string (`iv:authTag:encryptedText`).
   * Returns original plain text.
   */
  decrypt(encryptedText: string | null | undefined): string | null {
    if (!encryptedText) return null;
    if (!this.isEncrypted(encryptedText)) return encryptedText;

    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) return encryptedText;

      const [ivHex, authTagHex, encryptedHex] = parts;
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv(this.algorithm, this.secretKey, iv);

      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: any) {
      this.logger.error(`Decryption error: ${err.message}. Returning fallback.`);
      return encryptedText;
    }
  }

  /**
   * Checks if string is in `iv:authTag:encryptedText` format
   */
  private isEncrypted(text: string): boolean {
    const parts = text.split(':');
    if (parts.length !== 3) return false;
    return parts[0].length === 32 && parts[1].length === 32 && parts[2].length > 0;
  }
}
