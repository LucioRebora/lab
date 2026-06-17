const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CHUNK_SIZE = 1000;
const BATCH_SIZE = 500;

async function runImport(partFile, partLabel) {
    console.log(`\n==========================================`);
    console.log(`INICIANDO ${partLabel} (MODO BAJO CONSUMO)`);
    console.log(`==========================================`);

    console.log('1. Preparando diccionario de Sub-Determinaciones (necesario para vincular los resultados)...');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    console.log(`...diccionario listo con ${subDets.length} sub-determinaciones.`);
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const rl = readline.createInterface({
        input: fs.createReadStream(partFile),
        crlfDelay: Infinity
    });

    let count = 0;
    let saved = 0;
    let linesBatch = [];

    for await (const line of rl) {
        count++;
        if (count === 1) continue;

        const cols = parseCsvLine(line);
        if (cols.length >= 3) {
            linesBatch.push({
                extSubId: cols[0],
                extResId: cols[1],
                extSDId: cols[2],
                valor: cols[3],
                comentario: cols[4]
            });
        }

        if (linesBatch.length >= CHUNK_SIZE) {
            saved += await processChunk(linesBatch, subDetMap);
            linesBatch = [];
            console.log(`${partLabel}: Línea ${count}. Nuevos guardados: ${saved}`);
        }
    }

    if (linesBatch.length > 0) {
        saved += await processChunk(linesBatch, subDetMap);
    }

    console.log(`\n--- ${partLabel} FINALIZADA ---`);
    console.log(`Leídas: ${count}, Guardadas nuevas: ${saved}`);
}

async function processChunk(lines, subDetMap) {
    const extResIds = [...new Set(lines.map(l => l.extResId))];

    // Fetch only needed results for this chunk
    const results = await prisma.result.findMany({
        where: { codigoExterno: { in: extResIds } },
        select: { id: true, codigoExterno: true }
    });

    const resultMap = new Map();
    results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });

    const dataToInsert = [];
    for (const line of lines) {
        const resId = resultMap.get(line.extResId);
        const sdId = subDetMap.get(line.extSDId);
        if (resId && sdId) {
            dataToInsert.push({
                codigoExterno: line.extSubId,
                resultId: resId,
                subDeterminationId: sdId,
                valor: line.valor ? line.valor.replace(/\x00/g, '') : null,
                comentario: line.comentario ? line.comentario.replace(/\x00/g, '') : null,
                laboratoryId: LAB_ID,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }
    }

    let chunkSaved = 0;
    for (let i = 0; i < dataToInsert.length; i += BATCH_SIZE) {
        const batch = dataToInsert.slice(i, i + BATCH_SIZE);
        try {
            const res = await prisma.subResult.createMany({ data: batch, skipDuplicates: true });
            chunkSaved += res.count;
        } catch (e) {
            for (const item of batch) {
                try { await prisma.subResult.create({ data: item }); chunkSaved++; } catch (err) { }
            }
        }
    }
    return chunkSaved;
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
    console.log("INICIANDO IMPORTACION LOW-MEMORY");
    try {
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part2.csv', 'PARTE 2');
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part1.csv', 'PARTE 1 (REVISIÓN)');
        const finalCount = await prisma.subResult.count();
        console.log(`\nTODO LISTO. Conteo final: ${finalCount}`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
