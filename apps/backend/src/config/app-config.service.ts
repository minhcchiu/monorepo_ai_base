import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * AppConfig
 *
 * Type-safe configuration interface for the application.
 * Ensures all required environment variables are present and typed.
 */
interface AppConfig {
  // Node environment
  nodeEnv: 'development' | 'staging' | 'production' | 'test';
  port: number;

  // Database
  databaseUrl: string;

  // JWT
  jwtSecret: string;
  jwtAccessTokenExpires: string;
  jwtRefreshTokenExpires: string;

  // Security
  bcryptRounds: number;

  // CORS
  corsOrigin: string;

  // Base URL công khai của backend (dùng dựng URL file upload)
  publicBaseUrl: string;

  // Email (for sending verification emails, etc.)
  emailFrom: string;
  emailProvider: string; // 'smtp', 'sendgrid', 'ses', etc.
  emailSmtpHost?: string;
  emailSmtpPort?: number;
  emailSmtpUser?: string;
  emailSmtpPassword?: string;

  // Redis (for caching, sessions, etc.)
  redisUrl?: string;
  redisEnabled: boolean;

  // Logging
  logLevel: string;

  // API
  apiVersion: string;
  apiPrefix: string;

  // Firebase
  firebaseEnabled: boolean;
  firebaseServiceAccountJson?: string;
  firebaseServiceAccountBase64?: string;

  // OTP provider (eSMS)
  esmsEndpoint: string;
  esmsApiKey?: string;
  esmsSecretKey?: string;
  esmsOaId?: string;
  esmsTempId?: string;
  esmsSendingMode?: string;
  esmsCallbackUrl?: string;
}

/**
 * AppConfigService
 *
 * Type-safe configuration service.
 * Provides centralized access to all environment variables.
 * Validates configuration on initialization.
 *
 * Usage:
 * @Injectable()
 * export class MyService {
 *   constructor(private appConfig: AppConfigService) {}
 *
 *   someMethod() {
 *     const port = this.appConfig.getPort();
 *     const dbUrl = this.appConfig.getDatabaseUrl();
 *   }
 * }
 */
@Injectable()
export class AppConfigService {
  getSwaggerUser() {
    return 'admin@gmail.com';
  }

  getSwaggerPass() {
    return 'Phuong@123';
  }

  private readonly config: AppConfig;

  constructor(private configService: ConfigService) {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * Load configuration from environment variables
   */
  private loadConfig(): AppConfig {
    return {
      nodeEnv: this.configService.get('NODE_ENV') || 'development',
      port: parseInt(this.configService.get('PORT') || '8000', 10),
      databaseUrl: this.configService.get('DATABASE_URL') || '',
      jwtSecret: this.configService.get('JWT_SECRET') || '',
      jwtAccessTokenExpires: this.configService.get('JWT_ACCESS_TOKEN_EXPIRES') || '15m',
      jwtRefreshTokenExpires: this.configService.get('JWT_REFRESH_TOKEN_EXPIRES') || '7d',
      bcryptRounds: parseInt(this.configService.get('BCRYPT_ROUNDS') || '10', 10),
      corsOrigin: this.configService.get('CORS_ORIGIN') || '*',
      publicBaseUrl: this.configService.get('PUBLIC_BASE_URL') || '',
      emailFrom: this.configService.get('EMAIL_FROM') || 'noreply@example.com',
      emailProvider: this.configService.get('EMAIL_PROVIDER') || 'smtp',
      emailSmtpHost: this.configService.get('EMAIL_SMTP_HOST'),
      emailSmtpPort: parseInt(this.configService.get('EMAIL_SMTP_PORT') || '587', 10),
      emailSmtpUser: this.configService.get('EMAIL_SMTP_USER'),
      emailSmtpPassword: this.configService.get('EMAIL_SMTP_PASSWORD'),
      redisUrl: this.configService.get('REDIS_URL'),
      redisEnabled: this.configService.get('REDIS_ENABLED') === 'true',
      logLevel: this.configService.get('LOG_LEVEL') || 'info',
      apiVersion: this.configService.get('API_VERSION') || 'v1',
      apiPrefix: this.configService.get('API_PREFIX') || 'api',
      firebaseEnabled: this.configService.get('FIREBASE_ENABLED') === 'true',
      firebaseServiceAccountJson: this.configService.get('FIREBASE_SERVICE_ACCOUNT_JSON'),
      firebaseServiceAccountBase64: this.configService.get('FIREBASE_SERVICE_ACCOUNT_JSON_BASE64'),
      esmsEndpoint:
        this.configService.get('ESMS_ENDPOINT') ||
        this.configService.get('SMS_ENDPOINT') ||
        'https://rest.esms.vn/MainService.svc/json/SendZaloMessage_V6/',
      esmsApiKey: this.configService.get('ESMS_API_KEY') || this.configService.get('API_KEY'),
      esmsSecretKey:
        this.configService.get('ESMS_SECRET_KEY') || this.configService.get('SECRET_KEY'),
      esmsOaId:
        this.configService.get('ESMS_OAID') ||
        this.configService.get('OAID') ||
        '1062932021545762617',
      esmsTempId:
        this.configService.get('ESMS_TEMP_ID') ||
        this.configService.get('TEMP_ID') ||
        this.configService.get('TEMPID') ||
        '575292',
      esmsSendingMode:
        this.configService.get('ESMS_SENDING_MODE') ||
        this.configService.get('SENDING_MODE') ||
        '1',
      esmsCallbackUrl:
        this.configService.get('ESMS_CALLBACK_URL') ||
        this.configService.get('CALLBACK_URL') ||
        'https://esms.vn/webhook/',
    };
  }

  /**
   * Validate that all required configuration is present
   */
  private validateConfig() {
    const required = ['databaseUrl', 'jwtSecret'];

    for (const key of required) {
      if (!this.config[key as keyof AppConfig]) {
        throw new Error(`Missing required configuration: ${key}. Please check your .env file.`);
      }
    }
  }

  // ============================================================================
  // Getters for type-safe access
  // ============================================================================

  getNodeEnv(): string {
    return this.config.nodeEnv;
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }

  isTest(): boolean {
    return this.config.nodeEnv === 'test';
  }

  getPort(): number {
    return this.config.port;
  }

  getDatabaseUrl(): string {
    return this.config.databaseUrl;
  }

  getJwtSecret(): string {
    return this.config.jwtSecret;
  }

  getJwtAccessTokenExpires(): string {
    return this.config.jwtAccessTokenExpires;
  }

  getJwtRefreshTokenExpires(): string {
    return this.config.jwtRefreshTokenExpires;
  }

  getBcryptRounds(): number {
    return this.config.bcryptRounds;
  }

  getCorsOrigin(): string {
    return this.config.corsOrigin;
  }

  /**
   * Base URL công khai của backend, không có dấu `/` ở cuối.
   * Ưu tiên PUBLIC_BASE_URL; nếu chưa đặt thì lấy CORS_ORIGIN (bỏ qua '*'
   * và danh sách nhiều origin); cuối cùng fallback về localhost theo PORT.
   */
  getPublicBaseUrl(): string {
    const candidates = [this.config.publicBaseUrl, this.config.corsOrigin];

    for (const candidate of candidates) {
      const value = (candidate || '').trim();
      if (!value || value === '*' || value.includes(',')) continue;
      return value.replace(/\/+$/, '');
    }

    return `http://localhost:${this.config.port}`;
  }

  getEmailFrom(): string {
    return this.config.emailFrom;
  }

  getEmailProvider(): string {
    return this.config.emailProvider;
  }

  getEmailSmtpConfig() {
    return {
      host: this.config.emailSmtpHost,
      port: this.config.emailSmtpPort,
      auth: {
        user: this.config.emailSmtpUser,
        pass: this.config.emailSmtpPassword,
      },
    };
  }

  getRedisUrl(): string | undefined {
    return this.config.redisUrl;
  }

  isRedisEnabled(): boolean {
    return this.config.redisEnabled;
  }

  getLogLevel(): string {
    return this.config.logLevel;
  }

  getApiVersion(): string {
    return this.config.apiVersion;
  }

  getApiPrefix(): string {
    return this.config.apiPrefix;
  }

  /**
   * Get full API URL
   */
  getApiUrl(): string {
    return `/${this.config.apiPrefix}/${this.config.apiVersion}`;
  }

  isFirebaseEnabled(): boolean {
    return this.config.firebaseEnabled;
  }

  getFirebaseServiceAccountJson(): string | undefined {
    return this.config.firebaseServiceAccountJson;
  }

  getFirebaseServiceAccountBase64(): string | undefined {
    return this.config.firebaseServiceAccountBase64;
  }

  getEsmsEndpoint(): string {
    return this.config.esmsEndpoint;
  }

  getEsmsApiKey(): string | undefined {
    return this.config.esmsApiKey;
  }

  getEsmsSecretKey(): string | undefined {
    return this.config.esmsSecretKey;
  }

  getEsmsOaId(): string | undefined {
    return this.config.esmsOaId;
  }

  getEsmsTempId(): string | undefined {
    return this.config.esmsTempId;
  }

  getEsmsSendingMode(): string | undefined {
    return this.config.esmsSendingMode;
  }

  getEsmsCallbackUrl(): string | undefined {
    return this.config.esmsCallbackUrl;
  }
}
