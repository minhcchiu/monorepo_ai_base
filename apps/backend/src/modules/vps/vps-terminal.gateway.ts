import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class VpsTerminalGateway {
  private readonly logger = new Logger('VpsTerminalGateway');
}
