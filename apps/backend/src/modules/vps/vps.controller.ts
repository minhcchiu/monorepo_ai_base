import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VpsService } from './vps.service';

@ApiTags('VPS')
@Controller('vps')
export class VpsController {
  constructor(private readonly vpsService: VpsService) {}

  @Get()
  @ApiOperation({ summary: 'Get list of all VPS cluster instances' })
  findAll() {
    return this.vpsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details for a single VPS node' })
  findOne(@Param('id') id: string) {
    return this.vpsService.findOne(id);
  }

  @Post('test-connection')
  @ApiOperation({ summary: 'Test SSH connectivity before creating VPS' })
  testConnection(@Body() body: { ip: string; port?: number; username?: string; password?: string; sshKey?: string }) {
    return this.vpsService.testConnection(body);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new VPS instance record' })
  create(@Body() body: any) {
    return this.vpsService.create(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a VPS instance configuration' })
  update(@Param('id') id: string, @Body() body: any) {
    return this.vpsService.update(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a VPS instance' })
  remove(@Param('id') id: string) {
    return this.vpsService.remove(id);
  }

  @Post(':id/diagnose')
  @ApiOperation({ summary: 'Run diagnostic health check via SSH' })
  diagnose(@Param('id') id: string) {
    return this.vpsService.diagnose(id);
  }

  @Get(':id/pm2')
  @ApiOperation({ summary: 'Get live PM2 process list for target VPS' })
  getPm2Processes(@Param('id') id: string) {
    return this.vpsService.getPm2Processes(id);
  }

  @Post(':id/pm2/reload')
  @ApiOperation({ summary: 'Reload all PM2 processes via SSH' })
  reloadPm2Processes(@Param('id') id: string) {
    return this.vpsService.reloadPm2Processes(id);
  }

  @Post(':id/pm2/restart/:name')
  @ApiOperation({ summary: 'Restart single PM2 process via SSH' })
  restartPm2Process(@Param('id') id: string, @Param('name') name: string) {
    return this.vpsService.restartPm2Process(id, name);
  }

  @Post(':id/terminal/exec')
  @ApiOperation({ summary: 'Execute SSH shell command on target VPS' })
  execTerminalCommand(@Param('id') id: string, @Body('command') command: string) {
    return this.vpsService.execTerminalCommand(id, command);
  }

  @Get(':id/files')
  @ApiOperation({ summary: 'List files in remote directory via SSH' })
  getFiles(@Param('id') id: string) {
    return this.vpsService.getFiles(id);
  }

  @Get(':id/crons')
  @ApiOperation({ summary: 'List crontab scheduled jobs via SSH' })
  getCrons(@Param('id') id: string) {
    return this.vpsService.getCrons(id);
  }

  @Get(':id/domains')
  @ApiOperation({ summary: 'List Nginx domains & SSL status' })
  getDomains(@Param('id') id: string) {
    return this.vpsService.getDomains(id);
  }

  @Get(':id/backups')
  @ApiOperation({ summary: 'List backups on target VPS' })
  getBackups(@Param('id') id: string) {
    return this.vpsService.getBackups(id);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get live VPS log stream via SSH' })
  getLogs(@Param('id') id: string) {
    return this.vpsService.getLogs(id);
  }
}
