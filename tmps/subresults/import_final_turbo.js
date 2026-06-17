const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const BATCH_SIZE = 4000;
const LOG_EVERY = 25000;

async function runImport(partFile, partLabel) {
    console.log(`\n==========================================`);
    console.log(`INICIANDO ${partLabel} (MODO ALTA VELOCIDAD)`);
    console.log(`==========================================`);

    console.log('1. Cargando diccionario de Sub-Determinaciones...');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    console.log('2. Cargando diccionario maestro de Resultados (esto ahorra miles de consultas)...');
    const resultMap = new Map();
    let skip = 0;
    const resBatch = 100000;
    while (true) {
        const results = await prisma.result.findMany({
            select: { id: true, codigoExterno: true },
            take: resBatch,
            skip: skip
        });
        if (results.length === 0) break;
        results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });
        skip += resBatch;
        console.log(`...cargados ${resultMap.size} resultados.`);
    }

    console.log(`Cache completo: ${subDetMap.size} SubDets, ${resultMap.size} Results.`);

    const rl = readline.createInterface({
        input: fs.createReadStream(partFile),
        crlfDelay: Infinity
    });

    let count = 0;
    let saved = 0;
    let batch = [];

    for await (const line of rl) {
        count++;
        if (count === 1) continue;

        const cols = parseCsvLine(line);
        if (cols.length < 3) continue;

        const extResId = cols[1];
        const resId = resultMap.get(extResId);
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
            const res = await prisma.subResult.createMany({ data: batch, skipDuplicates: true });
            saved += res.count;
            batch = [];

            if (count % LOG_EVERY < BATCH_SIZE) {
                console.log(`${partLabel}: Línea ${count}. NUEVOS REGISTROS REALES: ${saved}`);
            }
        }
    }

    if (batch.length > 0) {
        const res = await prisma.subResult.createMany({ data: batch, skipDuplicates: true });
        saved += res.count;
    }

    console.log(`\n--- ${partLabel} FINALIZADA ---`);
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
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part2.csv', 'PARTE 2');
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part1.csv', 'PARTE 1');
        const finalCount = await prisma.subResult.count();
        console.log(`\n¡MISION CUMPLIDA! Conteo final: ${finalCount}`);
    } catch (err) {
        console.error("Error crítico:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
