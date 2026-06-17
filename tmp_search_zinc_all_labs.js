const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const dets = await prisma.determination.findMany({
      where: { nombre: 'ZINC EN SANGRE' }
    });
    console.log('ZINC EN SANGRE determinations:', dets.map(d => ({ id: d.id, codeExt: d.codigoExterno, labId: d.laboratoryId })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
