const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const hi = await prisma.healthInsurance.findFirst({
      where: { nombre: { contains: 'CONTADO', mode: 'insensitive' } }
    });

    if (!hi) {
      console.log('Health Insurance "CONTADO" not found');
      return;
    }

    console.log(`Health Insurance: ${hi.nombre} (ID: ${hi.id}, valorNBU: ${hi.valorNBU})`);

    const allGlucemias = await prisma.determination.findMany({
      where: { nombre: { contains: 'GLUCEMIA', mode: 'insensitive' } }
    });

    console.log(`Found ${allGlucemias.length} Determinations with 'GLUCEMIA' in name:`);
    for (const g of allGlucemias) {
      console.log(`- ID: ${g.id}, Name: ${g.nombre}, CodeExt: ${g.codigoExterno}, UB: ${g.ub}`);
      const specificConfig = await prisma.pricesOSConfig.findFirst({
        where: { determinationId: g.id, healthInsuranceId: hi.id }
      });
      if (specificConfig) {
        console.log(`  OS Config: NBU: ${specificConfig.cantidadNBU}, Price: ${specificConfig.precio}`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
