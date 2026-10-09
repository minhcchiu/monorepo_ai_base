import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

/**
 * CommonServicesModule
 * Global module for shared application-wide services.
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class CommonServicesModule {}
