const fs = require('node:fs');
const path = require('node:path');

const envPath = path.resolve(process.cwd(), '.env');
const envValues = {};

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    envValues[key] = value.replace(/^['"]|['"]$/g, '');
  }
}

process.env.DATABASE_URL = process.env.DATABASE_URL ?? envValues.DATABASE_URL ?? 'file:./dev.db';

const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { hash } = require('bcryptjs');

async function main() {
  const adapter = new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const email = 'leonardo@psi.com';
    const password = '123456';

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`Demo user already exists: ${email}`);
      return;
    }

    const passwordHash = await hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: 'Dr. Leonardo',
        email,
        passwordHash,
        role: 'PSYCHOLOGIST',
        psychologist: {
          create: {
            specialty: 'Psicologia clínica',
            phone: '(81) 99999-9999',
          },
        },
      },
    });

    console.log(`Demo user created: ${user.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Failed to seed demo user', error);
  process.exit(1);
});
