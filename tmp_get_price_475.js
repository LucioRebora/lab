const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const hi = await prisma.healthInsurance.findFirst({
      where: { nombre: { contains: 'CONTADO', mode: 'insensitive' } }
    });

    const det = await prisma.determination.findFirst({
      where: { codigoExterno: '475' }
    });

    if (!hi) {
      console.log('Health Insurance "CONTADO" not found');
      return;
    }
    if (!det) {
      console.log('Determination "475" not found');
      return;
    }

    console.log(`Health Insurance: ${hi.nombre} (ID: ${hi.id}, valorNBU: ${hi.valorNBU})`);
    console.log(`Determination: ${det.nombre} (ID: ${det.id}, UB: ${det.ub})`);

    const config = await prisma.pricesOSConfig.findFirst({
      where: {
        healthInsuranceId: hi.id,
        determinationId: det.id
      }
    });

    if (config) {
      console.log('PricesOSConfig found:');
      console.log(`  cantidadNBU: ${config.cantidadNBU}`);
      console.log(`  precio: ${config.precio}`);
      console.log(`  montoFijo: ${config.montoFijo}`);
      
      const price = config.precio || (config.cantidadNBU * hi.valorNBU);
      console.log(`Final Calculated Price: ${price}`);
    } else {
      console.log('No specific PricesOSConfig entry found.');
      console.log(`Fallback calculation (UB * valorNBU): ${det.ub * hi.valorNBU}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
