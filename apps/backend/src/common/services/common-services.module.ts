import { Global, Module } from '@nestjs/common';

/**
 * CommonServicesModule
 * Global module for shared application-wide services.
 * Add providers here to expose them across feature modules.
 */
@Global()
@Module({
  providers: [],
  exports: [],
})
export class CommonServicesModule {}
