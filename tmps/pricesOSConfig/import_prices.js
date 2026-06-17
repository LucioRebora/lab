const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CSV_FILE = 'c:\\Users\\DEX\\Proyectos\\bioitia\\tmps\\pricesOSConfig\\RenglonesDET.csv';

async function main() {
    console.log('Iniciando importación de PricesOSConfig...');

    // 1. Cargar mapeos en memoria para velocidad
    console.log('Cargando mapeos de Obras Sociales y Determinaciones...');
    const healthInsurances = await prisma.healthInsurance.findMany({
        select: { id: true, codigoExterno: true }
    });
    const determinations = await prisma.determination.findMany({
        select: { id: true, codigoExterno: true }
    });

    const hiMap = new Map(healthInsurances.map(hi => [hi.codigoExterno, hi.id]));
    const detMap = new Map(determinations.map(det => [det.codigoExterno, det.id]));

    console.log(`Mapeos cargados: ${hiMap.size} Obras Sociales, ${detMap.size} Determinaciones.`);

    const results = [];
    let count = 0;
    let skipped = 0;

    const stream = fs.createReadStream(CSV_FILE).pipe(csv());

    for await (const row of stream) {
        const hiId = hiMap.get(row.IDObraSocial);
        const detId = detMap.get(row.IDDeterminacion);

        if (!hiId || !detId) {
            skipped++;
            continue;
        }

        results.push({
            healthInsuranceId: hiId,
            determinationId: detId,
            cantidadNBU: row.CantidadNBU ? parseFloat(row.CantidadNBU) : 0,
            montoFijo: row.MontoFijo ? parseFloat(row.MontoFijo) : 0,
            precio: row.Precio ? parseFloat(row.Precio) : 0,
            enLista: row.EnLista === '1',
            laboratoryId: LAB_ID
        });

        count++;

        // Insertar en lotes de 1000
        if (results.length >= 1000) {
            await prisma.pricesOSConfig.createMany({
                data: results,
                skipDuplicates: true
            });
            results.length = 0;
            console.log(`Procesados: ${count} filas...`);
        }
    }

    // Insertar restantes
    if (results.length > 0) {
        await prisma.pricesOSConfig.createMany({
            data: results,
            skipDuplicates: true
        });
    }

    console.log(`Importación finalizada.`);
    console.log(`- Filas importadas/procesadas: ${count}`);
    console.log(`- Filas saltadas (ID no encontrado): ${skipped}`);

    await prisma.$disconnect();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
