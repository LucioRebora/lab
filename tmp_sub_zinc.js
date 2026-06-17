const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const det = await prisma.determination.findFirst({
      where: { nombre: 'ZINC EN SANGRE', codigoExterno: '999' }
    });
    console.log('Det:', det?.id, det?.nombre);

    const subDets = await prisma.subDetermination.findMany({
        where: { determinationId: det?.id }
    });
    console.log('SubDets count:', subDets.length);
    for (const sd of subDets) {
        console.log(`- SubDet: ${sd.nombre}, Code: ${sd.codigoExterno}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
