import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({});

async function main() {
  const passwordHash1 = await bcrypt.hash('123456', 10);
  const passwordHash2 = await bcrypt.hash('123456', 10);

  // Check if users already exist
  const existingUser1 = await prisma.user.findUnique({ where: { username: 'kenny' } });
  
  if (!existingUser1) {
    await prisma.user.create({
      data: {
        username: 'kenny',
        name: 'Kenny',
        passwordHash: passwordHash1,
        colorTheme: '#2563eb', // blue
      },
    });
    console.log('Usuario kenny creado');
  }

  const existingUser2 = await prisma.user.findUnique({ where: { username: 'ashley' } });
  
  if (!existingUser2) {
    await prisma.user.create({
      data: {
        username: 'ashley',
        name: 'Ashley',
        passwordHash: passwordHash2,
        colorTheme: '#db2777', // pink
      },
    });
    console.log('Usuario ashley creado');
  }

  // Config inicial
  const existingConfig = await prisma.appConfig.findUnique({ where: { id: 'singleton' } });
  if (!existingConfig) {
    await prisma.appConfig.create({
      data: {
        id: 'singleton',
        startDate: new Date('2025-10-04T00:00:00Z'),
      },
    });
    console.log('Configuración inicial creada');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
