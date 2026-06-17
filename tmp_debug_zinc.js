const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const det = await prisma.determination.findFirst({
      where: { nombre: 'ZINC EN SANGRE', codigoExterno: '999' }
    });
    
    const hi = await prisma.healthInsurance.findFirst({
      where: { nombre: 'CONTADO' }
    });

    console.log('Det:', det?.id, det?.nombre);
    console.log('HI:', hi?.id, hi?.nombre);

    const configs = await prisma.pricesOSConfig.findMany({
      where: {
        determinationId: det?.id,
        healthInsuranceId: hi?.id
      }
    });

    console.log('Configs count:', configs.length);
    for (const c of configs) {
      console.log(`- LabID: ${c.laboratoryId}, Price: ${c.precio}, NBU: ${c.cantidadNBU}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
