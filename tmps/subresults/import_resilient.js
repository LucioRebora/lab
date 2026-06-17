const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const BATCH_SIZE = 500;
const SCAN_LOG_EVERY = 1000;

async function runImport(partFile, partLabel, startLine = 0) {
    console.log(`\n==========================================`);
    console.log(`INICIANDO ${partLabel} desde línea ${startLine}`);
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
            console.log(`...cargados ${resultMap.size} resultados.`);
        } catch (e) {
            await new Promise(r => setTimeout(r, 2000));
        }
    }

    console.log(`Cache completo: ${subDetMap.size} SubDets, ${resultMap.size} Results.`);

    const rl = readline.createInterface({
        input: fs.createReadStream(partFile),
        crlfDelay: Infinity
    });

    let linesScanned = 0;
    let savedThisSession = 0;
    let batch = [];

    for await (const line of rl) {
        linesScanned++;
        if (linesScanned === 1) continue;
        if (linesScanned < startLine) continue;

        const cols = parseCsvLine(line);
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
            const inserted = await insertBatchSafe(batch);
            savedThisSession += inserted;
            batch = [];

            if (linesScanned % SCAN_LOG_EVERY === 0) {
                console.log(`[PROGRESO] Línea ${linesScanned}. NUEVOS REGISTROS REALES: ${savedThisSession}`);
            }
        }
    }

    if (batch.length > 0) {
        savedThisSession += await insertBatchSafe(batch);
    }

    console.log(`\n--- ${partLabel} FINALIZADA ---`);
    console.log(`Total escaneadas: ${linesScanned}, Nuevos agregados: ${savedThisSession}`);
}

async function insertBatchSafe(data) {
    try {
        const res = await prisma.subResult.createMany({ data, skipDuplicates: true });
        return res.count;
    } catch (e) {
        let count = 0;
        for (const item of data) {
            try { await prisma.subResult.create({ data: item }); count++; } catch (err) { }
        }
        return count;
    }
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
        // Resume from line 400,000 of Part 2 to save time on duplicates
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part2.csv', 'PARTE 2', 400000);
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part1.csv', 'PARTE 1', 0);
        const finalCount = await prisma.subResult.count();
        console.log(`\nCONTEO FINAL EN BD: ${finalCount}`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
