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

    const allZinc = await prisma.determination.findMany({
      where: { nombre: { contains: 'ZINC', mode: 'insensitive' } }
    });

    console.log(`Health Insurance: ${hi.nombre} (ID: ${hi.id}, valorNBU: ${hi.valorNBU})`);
    console.log(`Found ${allZinc.length} Determinations with 'ZINC' in name:`);
    for (const z of allZinc) {
      console.log(`- ID: ${z.id}, Name: ${z.nombre}, CodeExt: ${z.codigoExterno}, UB: ${z.ub}`);
      const specificConfig = await prisma.pricesOSConfig.findFirst({
        where: { determinationId: z.id, healthInsuranceId: hi.id }
      });
      if (specificConfig) {
        console.log(`  OS Config: NBU: ${specificConfig.cantidadNBU}, Price: ${specificConfig.precio}`);
        const finalPrice = specificConfig.precio || (specificConfig.cantidadNBU * hi.valorNBU);
        console.log(`  Calculated Price: ${finalPrice}`);
      } else {
        console.log(`  No OS Config found for this determination.`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
