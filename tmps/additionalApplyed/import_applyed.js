const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CSV_FILE = 'c:\\Users\\DEX\\Proyectos\\bioitia\\tmps\\additionalApplyed\\AdicionalesAplicados.csv';

async function main() {
    console.log('Iniciando importación de AdditionalApplyed...');

    console.log('Cargando mapeos...');
    const protocols = await prisma.protocol.findMany({ select: { id: true, codigoExterno: true } });
    const healthInsurances = await prisma.healthInsurance.findMany({ select: { id: true, codigoExterno: true } });
    const additionals = await prisma.additional.findMany({ select: { id: true, codigoExterno: true } });

    const protoMap = new Map(protocols.map(p => [p.codigoExterno, p.id]));
    const hiMap = new Map(healthInsurances.map(hi => [hi.codigoExterno, hi.id]));
    const addMap = new Map(additionals.map(a => [a.codigoExterno, a.id]));

    console.log(`Mapeos listos. Protocolos: ${protoMap.size}, OS: ${hiMap.size}, Adicionales: ${addMap.size}`);

    const results = [];
    let count = 0;
    let skipped = 0;

    const stream = fs.createReadStream(CSV_FILE).pipe(csv());

    for await (const row of stream) {
        const pId = protoMap.get(row.IDProtocolo);
        const addId = addMap.get(row.IDAdicional);
        const hiId = hiMap.get(row.IDObraSocial);

        if (!pId || !addId) {
            skipped++;
            continue;
        }

        results.push({
            codigoExterno: row.IDAdicionalAplicado,
            protocolId: pId,
            additionalId: addId,
            healthInsuranceId: hiId || null,
            montoFijo: row.MontoFijo ? parseFloat(row.MontoFijo) : 0,
            porcentajeSP: row.PorcentajeSP ? parseFloat(row.PorcentajeSP) : 0,
            laboratoryId: LAB_ID
        });

        count++;

        if (results.length >= 1000) {
            await prisma.additionalApplyed.createMany({
                data: results,
                skipDuplicates: true
            });
            results.length = 0;
            if (count % 10000 === 0) console.log(`Procesados: ${count}...`);
        }
    }

    if (results.length > 0) {
        await prisma.additionalApplyed.createMany({
            data: results,
            skipDuplicates: true
        });
    }

    console.log(`Importación finalizada.`);
    console.log(`- Procesados: ${count}`);
    console.log(`- Saltados (Prot o Add no encontrado): ${skipped}`);

    await prisma.$disconnect();
}

main().catch(console.error);
