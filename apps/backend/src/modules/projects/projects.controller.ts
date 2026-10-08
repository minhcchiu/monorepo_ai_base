import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Sse, MessageEvent } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@Controller('vps/:vpsId/projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // =========================================================================
  // STATIC ROUTES (MUST BE DEFINED BEFORE PARAMETERIZED :projectId ROUTES)
  // =========================================================================

  @Get()
  @ApiOperation({ summary: 'Get all projects for a specific VPS node' })
  findByVps(@Param('vpsId') vpsId: string) {
    return this.projectsService.findByVps(vpsId);
  }

  @Post('sync-pm2')
  @ApiOperation({ summary: 'Auto-discover & sync running PM2 processes into DB projects' })
  syncPm2Projects(@Param('vpsId') vpsId: string) {
    return this.projectsService.syncPm2Projects(vpsId);
  }

  @Post('inspect-repo')
  @ApiOperation({ summary: 'Auto-inspect Git repository URL over SSH and extract specs' })
  inspectRepo(
    @Param('vpsId') vpsId: string,
    @Body('gitRepo') gitRepo: string,
    @Body('branch') branch?: string,
    @Body('projectId') projectId?: string,
    @Body('workingDir') workingDir?: string,
  ) {
    return this.projectsService.inspectRepo(vpsId, gitRepo, branch, projectId, workingDir);
  }

  @Post('check-ports')
  @ApiOperation({ summary: 'Check if ports are already in use on target VPS or in DB' })
  checkPortsInUse(
    @Param('vpsId') vpsId: string,
    @Body() body: { ports: number[]; excludeProjectId?: string },
  ) {
    return this.projectsService.checkPortsAvailability(vpsId, body.ports, body.excludeProjectId);
  }

  @Post('sync-gitlab-variables')
  @ApiOperation({ summary: 'Auto-create CI/CD Variables on GitLab repository via REST API' })
  syncGitlabVariables(
    @Param('vpsId') vpsId: string,
    @Body() body: {
      gitRepo: string;
      gitlabToken?: string;
      variables: Array<{ key: string; value: string; masked?: boolean }>;
    },
  ) {
    return this.projectsService.syncGitlabVariables(vpsId, body);
  }

  @Post('trigger-gitlab-pipeline')
  @ApiOperation({ summary: 'Trigger pipeline run on GitLab repository via REST API' })
  triggerGitlabPipeline(
    @Param('vpsId') vpsId: string,
    @Body() body: {
      gitRepo: string;
      gitlabToken?: string;
      branch?: string;
    },
  ) {
    return this.projectsService.triggerGitlabPipeline(vpsId, body);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project on target VPS' })
  createProject(@Param('vpsId') vpsId: string, @Body() body: any) {
    return this.projectsService.createProject(vpsId, body);
  }

  // =========================================================================
  // PARAMETERIZED ROUTES (:projectId)
  // =========================================================================

  @Get(':projectId')
  @ApiOperation({ summary: 'Get details for a single project (validates VPS relation)' })
  findOne(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.findOne(vpsId, projectId);
  }

  @Get(':projectId/overview')
  @ApiOperation({ summary: 'Get project overview Bento specs & health' })
  getOverview(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getOverview(vpsId, projectId);
  }

  @Get(':projectId/runtime')
  @ApiOperation({ summary: 'Get project live PM2 process status' })
  getRuntime(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getRuntime(vpsId, projectId);
  }

  @Patch(':projectId/runtime')
  @ApiOperation({ summary: 'Update runtime engine & process mode configuration' })
  updateRuntime(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body() body: any,
  ) {
    return this.projectsService.updateRuntime(vpsId, projectId, body);
  }

  @Post(':projectId/runtime/restart')
  @ApiOperation({ summary: 'Restart PM2 process via SSH' })
  restartRuntime(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.restartRuntime(vpsId, projectId);
  }

  @Post(':projectId/runtime/stop')
  @ApiOperation({ summary: 'Stop PM2 process via SSH' })
  stopRuntime(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.stopRuntime(vpsId, projectId);
  }

  @Post(':projectId/runtime/start')
  @ApiOperation({ summary: 'Start PM2 process via SSH' })
  startRuntime(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.startRuntime(vpsId, projectId);
  }

  @Get(':projectId/logs')
  @ApiOperation({ summary: 'Fetch real PM2/application log stream' })
  getLogs(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Query('filter') filter?: string,
  ) {
    return this.projectsService.getLogs(vpsId, projectId, filter);
  }

  @Get(':projectId/deployments')
  @ApiOperation({ summary: 'Fetch deployment history' })
  getDeployments(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getDeployments(vpsId, projectId);
  }

  @Post(':projectId/deployments')
  @ApiOperation({ summary: 'Trigger new deployment rollout (Initial or Re-deploy)' })
  createDeployment(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body() body: {
      deployMode?: 'INITIAL' | 'RE_DEPLOY';
      author?: string;
      deployDir?: string;
      buildFilter?: string;
      runPrismaDbPush?: boolean;
    },
  ) {
    return this.projectsService.createDeployment(vpsId, projectId, body);
  }

  @Sse(':projectId/deployments/:deploymentId/stream')
  @ApiOperation({ summary: 'Stream real-time SSH deployment logs via Server-Sent Events (SSE)' })
  streamDeploymentLogs(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Param('deploymentId') deploymentId: string,
  ): Observable<MessageEvent> {
    return this.projectsService.streamDeploymentLogs(vpsId, projectId, deploymentId);
  }

  @Get(':projectId/gitlab-ci')
  @ApiOperation({ summary: 'Generate pre-configured .gitlab-ci.yml template' })
  getGitlabCiTemplate(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
  ) {
    return this.projectsService.getGitlabCiTemplate(vpsId, projectId);
  }

  @Post(':projectId/deployments/:deploymentId/rollback')
  @ApiOperation({ summary: 'Rollback to a specific deployment build' })
  rollbackDeployment(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Param('deploymentId') deploymentId: string,
  ) {
    return this.projectsService.rollbackDeployment(vpsId, projectId, deploymentId);
  }

  @Get(':projectId/ports')
  @ApiOperation({ summary: 'Get current port allocation & availability for monorepo apps' })
  getProjectPorts(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getProjectPorts(vpsId, projectId);
  }

  @Post(':projectId/ports/update')
  @ApiOperation({ summary: 'Update ports, modify .env, reload Nginx & restart PM2' })
  updateProjectPorts(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body() body: {
      backendPort?: number;
      adminPort?: number;
      webPort?: number;
    },
  ) {
    return this.projectsService.updateProjectPorts(vpsId, projectId, body);
  }

  @Get(':projectId/source')
  @ApiOperation({ summary: 'Get Git source repository specification' })
  getSource(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getSource(vpsId, projectId);
  }

  @Patch(':projectId/source')
  @ApiOperation({ summary: 'Update Git source repository specification' })
  updateSource(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body() body: any,
  ) {
    return this.projectsService.updateSource(vpsId, projectId, body);
  }

  @Post(':projectId/source/pull')
  @ApiOperation({ summary: 'Execute git pull on VPS repository' })
  gitPullSource(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.gitPullSource(vpsId, projectId);
  }

  @Get(':projectId/environment')
  @ApiOperation({ summary: 'Fetch project environment variables' })
  getEnvironment(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getEnvironment(vpsId, projectId);
  }

  @Post(':projectId/environment')
  @ApiOperation({ summary: 'Save environment variables & update .env file' })
  saveEnvironment(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body('vars') vars: Array<{ key: string; value: string }>,
  ) {
    return this.projectsService.saveEnvironment(vpsId, projectId, vars);
  }

  @Get(':projectId/domains')
  @ApiOperation({ summary: 'Get project custom domains & SSL' })
  getDomains(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getDomains(vpsId, projectId);
  }

  @Post(':projectId/domains')
  @ApiOperation({ summary: 'Add custom domain to project' })
  addDomain(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body() body: { domainName: string; targetPort?: number },
  ) {
    return this.projectsService.addDomain(vpsId, projectId, body);
  }

  @Delete(':projectId/domains/:domainId')
  @ApiOperation({ summary: 'Remove custom domain from project' })
  removeDomain(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Param('domainId') domainId: string,
  ) {
    return this.projectsService.removeDomain(vpsId, projectId, domainId);
  }

  @Post(':projectId/domains/:domainId/ssl')
  @ApiOperation({ summary: 'Issue or renew Let\'s Encrypt SSL certificate' })
  issueDomainSsl(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Param('domainId') domainId: string,
  ) {
    return this.projectsService.issueDomainSsl(vpsId, projectId, domainId);
  }

  @Get(':projectId/nginx')
  @ApiOperation({ summary: 'Get Nginx virtualhost configuration' })
  getNginxConfig(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getNginxConfig(vpsId, projectId);
  }

  @Post(':projectId/nginx/generate')
  @ApiOperation({ summary: 'Auto-generate Nginx virtualhost configuration template' })
  generateNginxConfig(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body() body?: {
      routingStrategy?: 'SUBDOMAIN' | 'PATH_PREFIX';
      baseDomain?: string;
      backendPort?: number;
      adminPort?: number;
      webPort?: number;
    },
  ) {
    return this.projectsService.generateNginxConfig(vpsId, projectId, body);
  }

  @Post(':projectId/nginx/test')
  @ApiOperation({ summary: 'Test Nginx configuration (nginx -t)' })
  testNginxConfig(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.testNginxConfig(vpsId, projectId);
  }

  @Post(':projectId/nginx')
  @ApiOperation({ summary: 'Save & reload Nginx configuration' })
  saveNginxConfig(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body() body: { config: string },
  ) {
    return this.projectsService.saveNginxConfig(vpsId, projectId, body);
  }

  @Get(':projectId/monitoring')
  @ApiOperation({ summary: 'Get process utilization metrics' })
  getMonitoring(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getMonitoring(vpsId, projectId);
  }

  @Get(':projectId/storage')
  @ApiOperation({ summary: 'Get project working directory storage footprint' })
  getStorage(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getStorage(vpsId, projectId);
  }

  @Get(':projectId/activity')
  @ApiOperation({ summary: 'Get project audit trail logs' })
  getActivity(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.getActivity(vpsId, projectId);
  }

  @Patch(':projectId/settings')
  @ApiOperation({ summary: 'Update project configuration settings' })
  updateSettings(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body() body: any,
  ) {
    return this.projectsService.updateSettings(vpsId, projectId, body);
  }

  @Post(':projectId/webhooks/deploy')
  @ApiOperation({ summary: 'Auto-trigger deployment via Git Webhook (GitHub/GitLab)' })
  handleGitWebhook(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body() body: any,
  ) {
    return this.projectsService.handleGitWebhook(vpsId, projectId, body);
  }

  @Post(':projectId/domains/dns-check')
  @ApiOperation({ summary: 'Check if domain A-record/CNAME matches target VPS IP' })
  checkDomainDns(
    @Param('vpsId') vpsId: string,
    @Param('projectId') projectId: string,
    @Body('domainName') domainName: string,
  ) {
    return this.projectsService.checkDomainDns(vpsId, projectId, domainName);
  }

  @Delete(':projectId')
  @ApiOperation({ summary: 'Stop PM2 process and remove project management scope' })
  removeProject(@Param('vpsId') vpsId: string, @Param('projectId') projectId: string) {
    return this.projectsService.deleteProjectAction(vpsId, projectId);
  }
}
