import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
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

  // =========================================================================
  // PM2 CONTROLS
  // =========================================================================

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

  @Post(':id/pm2/scale/:name')
  @ApiOperation({ summary: 'Scale PM2 process cluster instances' })
  scalePm2Process(@Param('id') id: string, @Param('name') name: string, @Body('instances') instances: number) {
    return this.vpsService.scalePm2Process(id, name, instances || 1);
  }

  @Post(':id/pm2/flush')
  @ApiOperation({ summary: 'Flush PM2 logs on VPS' })
  flushPm2Logs(@Param('id') id: string, @Body('name') name?: string) {
    return this.vpsService.flushPm2Logs(id, name);
  }

  @Post(':id/pm2/save')
  @ApiOperation({ summary: 'Save PM2 process list to ecosystem' })
  savePm2State(@Param('id') id: string) {
    return this.vpsService.savePm2State(id);
  }

  @Delete(':id/pm2/:name')
  @ApiOperation({ summary: 'Delete PM2 process from VPS' })
  deletePm2Process(@Param('id') id: string, @Param('name') name: string) {
    return this.vpsService.deletePm2Process(id, name);
  }

  // =========================================================================
  // TERMINAL
  // =========================================================================

  @Post(':id/terminal/exec')
  @ApiOperation({ summary: 'Execute SSH shell command on target VPS' })
  execTerminalCommand(@Param('id') id: string, @Body('command') command: string) {
    return this.vpsService.execTerminalCommand(id, command);
  }

  // =========================================================================
  // SFTP FILE MANAGER
  // =========================================================================

  @Get(':id/files')
  @ApiOperation({ summary: 'List files in remote directory via SFTP' })
  getFiles(@Param('id') id: string, @Query('dirPath') dirPath?: string) {
    return this.vpsService.getFiles(id, dirPath);
  }

  @Get(':id/files/read')
  @ApiOperation({ summary: 'Read file text content from remote VPS' })
  readFile(@Param('id') id: string, @Query('filePath') filePath: string) {
    return this.vpsService.readFile(id, filePath);
  }

  @Post(':id/files/write')
  @ApiOperation({ summary: 'Write text content to remote file on VPS' })
  writeFile(@Param('id') id: string, @Body() body: { filePath: string; content: string }) {
    return this.vpsService.writeFile(id, body.filePath, body.content);
  }

  @Delete(':id/files/delete')
  @ApiOperation({ summary: 'Delete file or directory from remote VPS' })
  deletePath(@Param('id') id: string, @Query('targetPath') targetPath: string) {
    return this.vpsService.deletePath(id, targetPath);
  }

  @Post(':id/files/chmod')
  @ApiOperation({ summary: 'Change file permissions (chmod) on VPS' })
  chmodPath(@Param('id') id: string, @Body() body: { targetPath: string; mode: string }) {
    return this.vpsService.chmodPath(id, body.targetPath, body.mode);
  }

  @Post(':id/files/mkdir')
  @ApiOperation({ summary: 'Create new directory on VPS' })
  createDir(@Param('id') id: string, @Body('dirPath') dirPath: string) {
    return this.vpsService.createDir(id, dirPath);
  }

  // =========================================================================
  // CRON JOBS
  // =========================================================================

  @Get(':id/crons')
  @ApiOperation({ summary: 'List crontab scheduled jobs via SSH' })
  getCrons(@Param('id') id: string) {
    return this.vpsService.getCrons(id);
  }

  @Post(':id/crons')
  @ApiOperation({ summary: 'Save/Update entire crontab schedule' })
  saveCronJobs(@Param('id') id: string, @Body('cronJobs') cronJobs: Array<{ schedule: string; command: string; active?: boolean }>) {
    return this.vpsService.saveCronJobs(id, cronJobs);
  }

  @Post(':id/crons/run')
  @ApiOperation({ summary: 'Run cron job command manually now' })
  runCronNow(@Param('id') id: string, @Body('command') command: string) {
    return this.vpsService.runCronNow(id, command);
  }

  // =========================================================================
  // DOMAINS, BACKUPS, FIREWALL
  // =========================================================================

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

  @Post(':id/backups')
  @ApiOperation({ summary: 'Create new database or file backup' })
  createBackup(@Param('id') id: string, @Body() body: { type: 'database' | 'filesystem'; dbName?: string; dbType?: 'postgres' | 'mysql'; targetDir?: string }) {
    return this.vpsService.createBackup(id, body);
  }

  @Get(':id/logs')
  @ApiOperation({ summary: 'Get live VPS log stream via SSH' })
  getLogs(@Param('id') id: string) {
    return this.vpsService.getLogs(id);
  }

  @Get(':id/ufw')
  @ApiOperation({ summary: 'Get UFW firewall status' })
  getUfwStatus(@Param('id') id: string) {
    return this.vpsService.getUfwStatus(id);
  }

  @Post(':id/ufw')
  @ApiOperation({ summary: 'Allow or deny UFW firewall port' })
  updateUfwRule(@Param('id') id: string, @Body() body: { port: number; action: 'allow' | 'deny' }) {
    return this.vpsService.updateUfwRule(id, body.port, body.action);
  }

  @Get(':id/deployments')
  @ApiOperation({ summary: 'Get deployment history across all projects on this VPS' })
  getVpsDeployments(@Param('id') id: string) {
    return this.vpsService.getVpsDeployments(id);
  }

  @Get(':id/monitoring')
  @ApiOperation({ summary: 'Get VPS live telemetry, active processes & chart metrics' })
  getVpsMonitoring(@Param('id') id: string, @Query('range') range?: string) {
    return this.vpsService.getVpsMonitoring(id, range);
  }

  @Get(':id/metrics')
  @ApiOperation({ summary: 'Get VPS historical telemetry metrics time-series chart data' })
  getVpsMetrics(@Param('id') id: string, @Query('range') range?: string) {
    return this.vpsService.getVpsMonitoring(id, range);
  }
}
