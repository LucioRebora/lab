const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CSV_PATH = path.join(__dirname, 'Resultados.csv');
const LABORATORY_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

async function main() {
    const currentCount = await prisma.result.count();
    console.log(`Starting results import from offset ${currentCount}...`);

    // 1. Fetch all mappings
    console.log('Fetching mappings...');
    const [protocols, determinations, sections, healthInsurances] = await Promise.all([
        prisma.protocol.findMany({ select: { id: true, codigoExterno: true }, where: { laboratoryId: LABORATORY_ID } }),
        prisma.determination.findMany({ select: { id: true, codigoExterno: true }, where: { laboratoryId: LABORATORY_ID } }),
        prisma.section.findMany({ select: { id: true, codigoExterno: true }, where: { laboratoryId: LABORATORY_ID } }),
        prisma.healthInsurance.findMany({ select: { id: true, codigoExterno: true }, where: { laboratoryId: LABORATORY_ID } }),
    ]);

    const protocolMap = new Map(protocols.filter(p => p.codigoExterno).map(p => [p.codigoExterno, p.id]));
    const determinationMap = new Map(determinations.filter(d => d.codigoExterno).map(d => [d.codigoExterno, d.id]));
    const sectionMap = new Map(sections.filter(s => s.codigoExterno).map(s => [s.codigoExterno, s.id]));
    const hiMap = new Map(healthInsurances.filter(h => h.codigoExterno).map(h => [h.codigoExterno, h.id]));

    let count = 0;
    let skipped = 0;
    let processedLine = 0;
    let batch = [];
    const BATCH_SIZE = 1000;

    const stream = fs.createReadStream(CSV_PATH).pipe(csv());

    for await (const row of stream) {
        processedLine++;
        if (processedLine <= currentCount) continue;

        const codigoExterno = row.IDResultado;
        if (!codigoExterno) continue;

        const protocolId = protocolMap.get(row.IDProtocolo);
        const determinationId = determinationMap.get(row.IDDeterminacion);

        if (!protocolId || !determinationId) {
            skipped++;
            continue;
        }

        batch.push({
            codigoExterno: codigoExterno,
            protocolId: protocolId,
            determinationId: determinationId,
            sectionId: sectionMap.get(row.IDSeccion) || null,
            healthInsuranceId: hiMap.get(row.IDObraSocial) || null,
            comentarioInterno: row.CometarioInterno || null,
            asignado: row.Asignado === '1',
            etiquetaImpresa: row.EtiquetaImpresa === '1',
            suspender: row.Suspender === '1',
            precio: parseFloat(row.Precio) || 0,
            debeReceta: row.DebeReceta === '1',
            debeOrden: row.DebeOrden === '1',
            numAutorizacion: row.NumAutorizacion || null,
            laboratoryId: LABORATORY_ID
        });

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            count += batch.length;
            process.stdout.write(`\rImported ${count} new results... (Total lines: ${processedLine})`);
            batch = [];
        }
    }

    if (batch.length > 0) {
        await insertBatch(batch);
        count += batch.length;
    }

    console.log(`\nMigration finished. Successfully imported ${count} more records.`);
}

async function insertBatch(data) {
    // No skipDuplicates here to avoid the heavy memory usage of server-side deduplication
    // assuming offset is correct.
    try {
        await prisma.result.createMany({
            data
        });
    } catch (err) {
        console.error('\nBatch failed, retrying with skipDuplicates once:', err.message);
        await prisma.result.createMany({ data, skipDuplicates: true }).catch(e => console.error('Retry failed:', e.message));
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
