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
