// This is a seed file for development data
// Run with: yarn db:seed

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable. Please create a .env file or set DATABASE_URL.');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data (development only!)
  if (process.env.NODE_ENV !== 'production') {
    await prisma.projectActivity.deleteMany();
    await prisma.projectDomain.deleteMany();
    await prisma.deployment.deleteMany();
    await prisma.project.deleteMany();
    await prisma.vps.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create admin user
  const seedPassword = process.env.SEED_PASSWORD || 'Password123!';
  const adminPassword = await bcrypt.hash(seedPassword, 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create regular user
  const userPassword = await bcrypt.hash(seedPassword, 10);
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Created regular user:', user.email);

  // Create moderator user
  const modPassword = await bcrypt.hash(seedPassword, 10);
  const moderator = await prisma.user.create({
    data: {
      email: 'moderator@example.com',
      password: modPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'MODERATOR',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  console.log('✅ Created moderator user:', moderator.email);

  // Seed VPS instances
  const vps1 = await prisma.vps.create({
    data: {
      id: 'api-prod-cluster-01',
      name: 'Production API Cluster 01',
      ip: '103.56.162.45',
      port: 22,
      os: 'Ubuntu 24.04.1 LTS',
      kernel: 'Linux 6.8.0-40-generic x86_64',
      uptime: '142 days 18 hrs',
      region: 'Singapore (SG-01)',
      regionCode: 'SG-01',
      environment: 'prod',
      status: 'ONLINE',
      statusBadgeText: 'Online',
      cpuPercent: 32,
      ramPercent: 61,
      diskPercent: 48,
      ramUsedGb: 19.5,
      ramTotalGb: 32,
      diskUsedGb: 240,
      diskTotalGb: 500,
      networkInMbps: 42.1,
      networkOutMbps: 28.4,
      dockerInstalled: true,
      nginxInstalled: true,
      redisInstalled: true,
      postgresInstalled: true,
    },
  });

  const vps2 = await prisma.vps.create({
    data: {
      id: 'staging-gateway-hcm',
      name: 'Staging Gateway HCM',
      ip: '103.56.162.88',
      port: 2222,
      os: 'Debian 12 Bookworm',
      kernel: 'Linux 6.1.0-21-amd64 x86_64',
      uptime: '89 days 4 hrs',
      region: 'Vietnam (VN-HCM)',
      regionCode: 'VN-HCM',
      environment: 'staging',
      status: 'ONLINE',
      statusBadgeText: 'Online',
      cpuPercent: 18,
      ramPercent: 42,
      diskPercent: 35,
      ramUsedGb: 6.7,
      ramTotalGb: 16,
      diskUsedGb: 87.5,
      diskTotalGb: 250,
      networkInMbps: 14.2,
      networkOutMbps: 12.1,
      dockerInstalled: true,
      nginxInstalled: true,
      redisInstalled: true,
      postgresInstalled: false,
    },
  });

  console.log('✅ Created VPS seed records');

  // Seed Projects
  const proj1 = await prisma.project.create({
    data: {
      id: 'calo-ai-backend',
      vpsId: vps1.id,
      name: 'Calo AI Backend API',
      description: 'Core NestJS application microservice handling AI workloads and user queries',
      engine: 'NestJS / Node.js 20',
      environment: 'prod',
      status: 'RUNNING',
      pm2Name: 'calo-ai-backend',
      pm2Instances: '8 cluster workers',
      port: 3000,
      domainProxy: 'api.calo.io',
      gitRepo: 'https://github.com/izisoft/calo-ai-backend',
      gitBranch: 'main',
      gitHash: 'c9f82a1',
      workingDir: '/var/www/apps/calo-ai-backend',
      cpuPercent: 12.4,
      memoryMb: 184.2,
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      id: 'calo-auth-identity',
      vpsId: vps2.id,
      name: 'Calo Auth Identity',
      description: 'Authentication service for OAuth, JWT, and session verification',
      engine: 'Express / TypeScript',
      environment: 'staging',
      status: 'RUNNING',
      pm2Name: 'calo-auth-service',
      pm2Instances: '4 fork processes',
      port: 3001,
      domainProxy: 'auth.calo.io',
      gitRepo: 'https://github.com/izisoft/calo-auth-identity',
      gitBranch: 'staging',
      gitHash: 'a8190d4',
      workingDir: '/var/www/apps/calo-auth-identity',
      cpuPercent: 2.1,
      memoryMb: 94.6,
    },
  });

  console.log('✅ Created Project seed records');

  // Seed Deployments
  await prisma.deployment.createMany({
    data: [
      {
        projectId: proj1.id,
        buildNumber: '#210',
        commitHash: 'c9f82a1',
        branch: 'main',
        author: 'Tuấn Lê',
        status: 'SUCCESS',
        timeAgo: '18m ago',
        triggeredBy: 'Manual Trigger',
        logs: '[10:02:01] Starting deployment\n[10:02:03] Pulling repository\n[10:02:09] Installing dependencies\n[10:02:41] Building\n[10:03:05] Restarting process\n[10:03:07] Health check OK\n[10:03:08] Deployment Success',
      },
      {
        projectId: proj1.id,
        buildNumber: '#209',
        commitHash: 'b4412e0',
        branch: 'main',
        author: 'Minh Nguyễn',
        status: 'SUCCESS',
        timeAgo: '1d ago',
        triggeredBy: 'Git Push',
        logs: 'Build #209 succeeded',
      },
    ],
  });

  // Seed Domains
  await prisma.projectDomain.create({
    data: {
      projectId: proj1.id,
      domainName: 'api.calo.io',
      targetPort: 3000,
      sslStatus: 'VALID',
      sslExpiryDays: 88,
      httpPort: 443,
    },
  });

  // Seed Activities
  await prisma.projectActivity.createMany({
    data: [
      {
        projectId: proj1.id,
        type: 'DEPLOY',
        title: 'Project Deployed',
        description: 'Build #210 deployed by Tuấn Lê',
        time: '18m ago',
      },
      {
        projectId: proj1.id,
        type: 'PM2',
        title: 'Process Restarted',
        description: 'PM2 process manually reloaded by Minh Nguyễn',
        time: '42m ago',
      },
      {
        projectId: proj1.id,
        type: 'ENV',
        title: 'Environment Updated',
        description: 'DATABASE_URL value updated by Minh Nguyễn',
        time: '1d ago',
      },
    ],
  });

  console.log('✅ Created Deployments, Domains, Activities seed records');

  // Create health check record
  await prisma.healthCheck.create({
    data: {
      status: 'healthy',
      message: 'Database seeded successfully',
    },
  });

  console.log('✅ Seeding completed!\n');
  console.log('Test Credentials:');
  console.log(`- Admin: admin@example.com / ${process.env.SEED_PASSWORD ? '********' : 'Password123!'}`);
  console.log(`- User: user@example.com / ${process.env.SEED_PASSWORD ? '********' : 'Password123!'}`);
  console.log(`- Moderator: moderator@example.com / ${process.env.SEED_PASSWORD ? '********' : 'Password123!'}`);
}

main()
  .catch((error) => {
    console.error('Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
