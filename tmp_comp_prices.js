const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const det_12 = await prisma.determination.findFirst({
        where: { codigoExterno: '12' }
    });
    console.log('Determination Code 12:', det_12.nombre, 'ID:', det_12.id);

    const prices = await prisma.pricesOSConfig.findMany({
        where: { determinationId: det_12.id, NOT: { precio: 0 } },
        include: { healthInsurance: { select: { nombre: true } } }
    });
    console.log(`Found ${prices.length} non-zero prices for Code 12:`);
    for (const p of prices) {
        console.log(`- Insurance: ${p.healthInsurance.nombre}, Price: ${p.precio}, NBU: ${p.cantidadNBU}`);
    }

    const det_731 = await prisma.determination.findFirst({
        where: { codigoExterno: '731' }
    });
    console.log('Determination Code 731:', det_731.nombre, 'ID:', det_731.id);
    const prices_731 = await prisma.pricesOSConfig.findMany({
        where: { determinationId: det_731.id, NOT: { precio: 0 } },
        include: { healthInsurance: { select: { nombre: true } } }
    });
    console.log(`Found ${prices_731.length} non-zero prices for Code 731:`);
    for (const p of prices_731) {
        console.log(`- Insurance: ${p.healthInsurance.nombre}, Price: ${p.precio}, NBU: ${p.cantidadNBU}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
