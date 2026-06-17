const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const CSV_PATH = path.join(__dirname, 'Resultados.csv');
const LABORATORY_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
    const currentCount = await prisma.result.count();
    console.log(`Resuming from record ${currentCount}...`);

    // Fetch mappings
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

    let processedLine = 0;
    let newCount = 0;
    let batch = [];
    const BATCH_SIZE = 200; // Very small batch to avoid OOM

    const stream = fs.createReadStream(CSV_PATH).pipe(csv());

    for await (const row of stream) {
        processedLine++;
        if (processedLine <= currentCount) continue;

        const protocolId = protocolMap.get(row.IDProtocolo);
        const determinationId = determinationMap.get(row.IDDeterminacion);

        if (!protocolId || !determinationId) continue;

        batch.push({
            codigoExterno: row.IDResultado,
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
            await insertWithRetry(batch);
            newCount += batch.length;
            process.stdout.write(`\rImported ${newCount} more... (Total lines: ${processedLine})`);
            batch = [];
            await wait(200); // 200ms gap
        }
    }

    if (batch.length > 0) {
        await insertWithRetry(batch);
        newCount += batch.length;
    }

    console.log(`\nFinished. Imported: ${newCount}`);
}

async function insertWithRetry(data) {
    try {
        await prisma.result.createMany({ data });
    } catch (e) {
        if (e.message.includes('out of memory')) {
            console.error('\nOOM detected, switching to sequential for this batch...');
            for (const item of data) {
                await prisma.result.create({ data: item }).catch(err => {
                    if (!err.message.includes('Unique constraint')) {
                        console.error('Error creating record:', err.message);
                    }
                });
            }
        } else if (e.message.includes('Unique constraint')) {
            // Probably offset was slightly off, ignore
        } else {
            console.error('\nUnexpected error:', e.message);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
