import { Injectable, Logger } from '@nestjs/common';
import { ServiceAccount, cert, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { AppConfigService } from '../../config';

type SendPushNotificationInput = {
  title: string;
  body: string;
  data?: Record<string, string>;
};

type SendPushNotificationResult = {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
};

@Injectable()
export class FirebaseMessagingService {
  private readonly logger = new Logger(FirebaseMessagingService.name);
  private readonly appName = 'pp09base-backend-firebase';

  constructor(private readonly appConfig: AppConfigService) {}

  isEnabled() {
    return !!this.getFirebaseApp();
  }

  async sendToTokens(
    tokens: string[],
    payload: SendPushNotificationInput,
  ): Promise<SendPushNotificationResult> {
    const app = this.getFirebaseApp();
    const uniqueTokens = Array.from(new Set(tokens.map((token) => token.trim()).filter(Boolean)));

    if (!app || !uniqueTokens.length) {
      return {
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
      };
    }

    const response = await getMessaging(app).sendEachForMulticast({
      tokens: uniqueTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data,
    });

    const invalidTokens = response.responses
      .map((item, index) => ({ item, token: uniqueTokens[index] }))
      .filter(({ item }) => !item.success && this.isInvalidTokenError(item.error?.code))
      .map(({ token }) => token);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens,
    };
  }

  private getFirebaseApp() {
    if (!this.appConfig.isFirebaseEnabled()) {
      return null;
    }

    const existingApp = getApps().find((app) => app.name === this.appName);
    if (existingApp) {
      return existingApp;
    }

    const serviceAccount = this.resolveServiceAccount();
    if (!serviceAccount) {
      this.logger.warn(
        'Firebase is enabled but service account credentials are missing or invalid.',
      );
      return null;
    }

    try {
      return initializeApp(
        {
          credential: cert(serviceAccount),
        },
        this.appName,
      );
    } catch (error) {
      try {
        return getApp(this.appName);
      } catch {
        this.logger.error('Failed to initialize Firebase Admin app.', error as Error);
        return null;
      }
    }
  }

  private resolveServiceAccount(): ServiceAccount | null {
    const json = this.appConfig.getFirebaseServiceAccountJson();
    const base64 = this.appConfig.getFirebaseServiceAccountBase64();
    const rawValue = json || (base64 ? Buffer.from(base64, 'base64').toString('utf8') : '');

    if (!rawValue) {
      return null;
    }

    try {
      const parsed = JSON.parse(rawValue) as ServiceAccount & { private_key?: string };
      return {
        ...parsed,
        privateKey: parsed.privateKey ?? parsed.private_key?.replace(/\\n/g, '\n'),
      };
    } catch (error) {
      this.logger.error('Failed to parse Firebase service account JSON.', error as Error);
      return null;
    }
  }

  private isInvalidTokenError(code?: string) {
    return (
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/registration-token-not-registered'
    );
  }
}
