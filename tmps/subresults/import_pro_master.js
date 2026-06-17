const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CONCURRENCY = 20; // Parallel inserts

async function main() {
    process.on('SIGINT', () => { console.log('\nInterrupción (CTRL+C). Finalizando...'); prisma.$disconnect(); process.exit(); });

    console.log("=== INICIANDO RE-CARGA DE SUB-RESULTADOS (MODO PARALLEL-STABLE) ===");

    console.log("1. Eliminando sub-resultados anteriores para inicio limpio...");
    const { count: deleted } = await prisma.subResult.deleteMany({});
    console.log(`Borrados: ${deleted}`);

    console.log("2. Cargando diccionarios de relaciones...");
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

    console.log("3. Iniciando importacion limpia (multi-linea)...");
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
        for (let i = 0; i < line.length; i++) {
            if (line[i] === '"') {
                if (i > 0 && line[i - 1] === '\\') continue;
                if (line[i + 1] === '"') { i++; continue; }
                inQuotes = !inQuotes;
            }
        }
        currentBlock += (currentBlock ? "\n" : "") + line;
        if (inQuotes) continue;

        if (linesProcessed === 1 && currentBlock.toLowerCase().includes("idsubresultado")) {
            currentBlock = "";
            continue;
        }

        const cols = parseCsvLine(currentBlock);
        currentBlock = "";

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
                // If unique constraint error, ignore
                if (!e.message.includes('Unique constraint failed')) {
                    // console.error('\nError en insert:', e.message.slice(0, 50));
                }
            }));
        }

        if (queue.length >= CONCURRENCY) {
            const results = await Promise.all(queue);
            recordsCreated += results.filter(r => r).length;
            queue = [];

            if (linesProcessed % 500 === 0 || recordsCreated % 500 === 0) {
                process.stdout.write(`Línea: ${linesProcessed} | Guardados: ${recordsCreated}        \r`);
            }
        }
    }

    if (queue.length > 0) {
        const results = await Promise.all(queue);
        recordsCreated += results.filter(r => r).length;
    }
    console.log(`\n\n--- IMPORTACION FINALIZADA ---`);
    console.log(`Registros totales guardados: ${recordsCreated}`);
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
