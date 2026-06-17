const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const configs = await prisma.pricesOSConfig.findMany({
      where: {
        determination: { nombre: 'ZINC EN SANGRE' },
        healthInsurance: { nombre: 'CONTADO' }
      }
    });
    console.log('Configs for ZINC EN SANGRE and CONTADO:');
    for (const c of configs) {
        console.log(`- LabId: ${c.laboratoryId}, Price: ${c.precio}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
