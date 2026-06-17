const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CSV_FILE = 'c:\\Users\\DEX\\Proyectos\\bioitia\\tmps\\pricesAdditionalOSConfig\\RenglonesADC.csv';

async function main() {
    console.log('Iniciando importación de AdditionalPricesOSConfig...');

    const healthInsurances = await prisma.healthInsurance.findMany({ select: { id: true, codigoExterno: true } });
    const additionals = await prisma.additional.findMany({ select: { id: true, codigoExterno: true } });

    const hiMap = new Map(healthInsurances.map(hi => [hi.codigoExterno, hi.id]));
    const addMap = new Map(additionals.map(a => [a.codigoExterno, a.id]));

    const results = [];
    const stream = fs.createReadStream(CSV_FILE).pipe(csv());

    for await (const row of stream) {
        const hiId = hiMap.get(row.IDObraSocial);
        const addId = addMap.get(row.IDAdicional);

        if (!hiId || !addId) continue;

        results.push({
            healthInsuranceId: hiId,
            additionalId: addId,
            montoFijo: row.MontoFijo ? parseFloat(row.MontoFijo) : 0,
            porcentajeSP: row.PorcentajeSP ? parseFloat(row.PorcentajeSP) : 0,
            enLista: row.EnLista === '1',
            laboratoryId: LAB_ID
        });
    }

    if (results.length > 0) {
        await prisma.additionalPricesOSConfig.createMany({
            data: results,
            skipDuplicates: true
        });
    }

    console.log(`Importación finalizada: ${results.length} filas.`);
    await prisma.$disconnect();
}

main().catch(console.error);
