const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CONCURRENCY = 30; // Slightly higher for the final push
const START_LINE = 2750000; // Safe buffer before the 2.77M mark

async function main() {
    process.on('SIGINT', () => { console.log('\nInterrupción (CTRL+C). Finalizando...'); prisma.$disconnect(); process.exit(); });

    console.log(`=== REANUDANDO CARGA DE SUB-RESULTADOS (DESDE LÍNEA ${START_LINE}) ===`);

    console.log("1. Cargando diccionarios de relaciones...");
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const resultMap = new Map();
    let skipResults = 0;
    while (true) {
        const results = await prisma.result.findMany({ select: { id: true, codigoExterno: true }, take: 100000, skip: skipResults });
        if (results.length === 0) break;
        results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });
        skipResults += 100000;
        process.stdout.write(`...${resultMap.size} Resultados en cache\r`);
    }
    console.log(`\nCache listo: ${subDetMap.size} SubDets, ${resultMap.size} Results.`);

    console.log("2. Escaneando y reanudando importacion...");
    const rl = readline.createInterface({
        input: fs.createReadStream('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv'),
        crlfDelay: Infinity
    });

    let linesProcessed = 0;
    let recordsCreated = 0;
    let currentBlock = "";
    let inQuotes = false;
    let queue = [];

    for await (const line of rl) {
        linesProcessed++;

        // Multi-line quote logic
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                if (i > 0 && line[i - 1] === '\\') continue;
                if (line[i + 1] === '"') { i++; continue; }
                inQuotes = !inQuotes;
            }
        }
        currentBlock += (currentBlock ? "\n" : "") + line;
        if (inQuotes) continue;

        // Block is complete. Decide if we process it.
        const blockToProcess = currentBlock;
        currentBlock = "";

        if (linesProcessed === 1 && blockToProcess.toLowerCase().includes("idsubresultado")) continue;

        // SKIP if we haven't reached the start line
        if (linesProcessed < START_LINE) {
            if (linesProcessed % 100000 === 0) process.stdout.write(`Saltando: ${linesProcessed} líneas...\r`);
            continue;
        }

        const cols = parseCsvLine(blockToProcess);
        if (cols.length < 3) continue;

        const resId = resultMap.get(cols[1]);
        const sdId = subDetMap.get(cols[2]);

        if (resId && sdId) {
            const data = {
                codigoExterno: cols[0],
                resultId: resId,
                subDeterminationId: sdId,
                valor: cols[3] ? cols[3].replace(/\x00/g, '') : null,
                comentario: cols[4] ? cols[4].slice(0, 5000).replace(/\x00/g, '') : null,
                laboratoryId: LAB_ID,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            queue.push(prisma.subResult.create({ data }).catch(e => {
                // Ignore unique constraint errors (already in DB)
            }));
        }

        if (queue.length >= CONCURRENCY) {
            const results = await Promise.all(queue);
            recordsCreated += results.filter(r => r).length;
            queue = [];

            if (linesProcessed % 100 === 0) {
                process.stdout.write(`Línea: ${linesProcessed} | Nuevos insertados: ${recordsCreated}        \r`);
            }
        }
    }

    if (queue.length > 0) {
        const results = await Promise.all(queue);
        recordsCreated += results.filter(r => r).length;
    }
    console.log(`\n\n--- REANUDACIÓN FINALIZADA ---`);
    console.log(`Líneas totales escaneadas: ${linesProcessed}`);
    console.log(`Nuevos registros agregados: ${recordsCreated}`);

    const finalCount = await prisma.subResult.count();
    console.log(`CONTEO FINAL EN BD: ${finalCount}`);
}

function parseCsvLine(text) {
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
            else inQ = !inQ;
        } else if (c === ',' && !inQ) {
            cols.push(cur.trim());
            cur = '';
        } else cur += c;
    }
    cols.push(cur.trim());
    return cols;
}

main().catch(console.error).finally(() => prisma.$disconnect());
