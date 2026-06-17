const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const det_104 = await prisma.determination.findFirst({
        where: { OR: [ { codigoExterno: '104' }, { nombre: 'Resultado' } ] }
    });
    console.log('Determination with code 104 or name "Resultado":', det_104);

    const hi_contado = await prisma.healthInsurance.findFirst({
        where: { nombre: { contains: 'CONTADO', mode: 'insensitive' } }
    });
    console.log('Health Insurance "CONTADO":', hi_contado);

    if (det_104 && hi_contado) {
        const config = await prisma.pricesOSConfig.findFirst({
            where: { determinationId: det_104.id, healthInsuranceId: hi_contado.id }
        });
        console.log('PricesOSConfig for 104/CONTADO:', config);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
