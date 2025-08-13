/* eslint-disable no-console */
import { PrismaClient, RoleType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const organization = await prisma.organization.upsert({
    where: { id: 'org-seed-1' },
    update: {},
    create: { id: 'org-seed-1', name: 'Default Health Org' }
  });

  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  await prisma.user.upsert({
    where: { email: 'owner@nadra.local' },
    update: {},
    create: {
      email: 'owner@nadra.local',
      username: 'owner',
      name: 'Health Owner',
      passwordHash,
      role: RoleType.HEALTH_OWNER,
      organizationId: organization.id
    }
  });

  console.log('Seed completed');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


