const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const BATCH_SIZE = 500;

async function runImport(partFile, partLabel) {
    console.log(`\n==========================================`);
    console.log(`INICIANDO REPARACIÓN: ${partLabel}`);
    console.log(`==========================================`);

    console.log('1. Cargando diccionarios de relaciones...');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const resultMap = new Map();
    let skipResults = 0;
    const resBatch = 50000;
    while (true) {
        try {
            const results = await prisma.result.findMany({
                select: { id: true, codigoExterno: true },
                take: resBatch,
                skip: skipResults
            });
            if (results.length === 0) break;
            results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });
            skipResults += resBatch;
            process.stdout.write(`...${resultMap.size} cargados\r`);
        } catch (e) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }
    console.log(`\nCache completo: ${subDetMap.size} SubDets, ${resultMap.size} Results.`);

    const rl = readline.createInterface({
        input: fs.createReadStream(partFile),
        crlfDelay: Infinity
    });

    let recordsProcessed = 0;
    let recordsSaved = 0;
    let currentBlock = "";
    let inQuotes = false;
    let batch = [];

    for await (const line of rl) {
        // Multi-line aware grouping
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                if (i > 0 && line[i - 1] === '\\') continue;
                if (line[i + 1] === '"') { i++; continue; }
                inQuotes = !inQuotes;
            }
        }
        currentBlock += (currentBlock ? "\n" : "") + line;
        if (inQuotes) continue;

        recordsProcessed++;
        if (recordsProcessed === 1 && currentBlock.includes("idsubresultado")) { currentBlock = ""; continue; }

        const cols = parseCsvLine(currentBlock);
        currentBlock = "";

        if (cols.length < 3) continue;

        const resId = resultMap.get(cols[1]);
        const sdId = subDetMap.get(cols[2]);

        if (resId && sdId) {
            batch.push({
                codigoExterno: cols[0],
                resultId: resId,
                subDeterminationId: sdId,
                valor: cols[3] ? cols[3].replace(/\x00/g, '') : null,
                comentario: cols[4] ? cols[4].replace(/\x00/g, '') : null,
                laboratoryId: LAB_ID,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        if (batch.length >= BATCH_SIZE) {
            recordsSaved += await doUpsert(batch);
            batch = [];
            process.stdout.write(`Procesados: ${recordsProcessed} | Guardados/Actualizados: ${recordsSaved}\r`);
        }
    }

    if (batch.length > 0) {
        recordsSaved += await doUpsert(batch);
    }

    console.log(`\n--- ${partLabel} FINALIZADA ---`);
    console.log(`Total: ${recordsProcessed}, Guardados/Reparados: ${recordsSaved}`);
}

async function doUpsert(data) {
    let count = 0;
    for (const item of data) {
        try {
            // Upsert manually because createMany skipDuplicates wont update the comment
            await prisma.subResult.upsert({
                where: { codigoExterno: item.codigoExterno },
                update: {
                    comentario: item.comentario,
                    valor: item.valor
                },
                create: item
            });
            count++;
        } catch (e) {
            // Silence errors for speed
        }
    }
    return count;
}

function parseCsvLine(line) {
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
            if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
            else inQ = !inQ;
        } else if (c === ',' && !inQ) {
            cols.push(cur.trim());
            cur = '';
        } else cur += c;
    }
    cols.push(cur.trim());
    return cols;
}

async function main() {
    try {
        // We only use the BIG CSV file now to ensure full multi-line context
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv', 'CSV COMPLETO (REPARACIÓN)');
        console.log(`\n¡REPARACIÓN FINALIZADA CON ÉXITO!`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
