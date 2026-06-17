const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CSV_PATH = 'C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv';
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const BATCH_SIZE = 1000;

async function main() {
    console.log('--- SubResults Import Background Version ---');

    console.log('Caching relations...');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const resultMap = new Map();
    const results = await prisma.result.findMany({ select: { id: true, codigoExterno: true } });
    results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });

    const currentCount = await prisma.subResult.count();

    // Saltamos hasta el punto donde nos quedamos (dejando margen de seguridad)
    const skipThreshold = Math.max(0, currentCount - 15000);
    console.log(`Actual en DB: ${currentCount}. Saltando primeras ${skipThreshold} lineas...`);

    const rl = readline.createInterface({ input: fs.createReadStream(CSV_PATH), crlfDelay: Infinity });

    let count = 0;
    let batch = [];
    let imported = 0;

    for await (const line of rl) {
        count++;
        if (count === 1) continue;

        if (count <= skipThreshold) continue;

        const cols = parseCsvLine(line);
        if (cols.length < 3) continue;

        const resId = resultMap.get(cols[1]);
        const sdId = subDetMap.get(cols[2]);

        if (resId && sdId) {
            batch.push({
                codigoExterno: cols[0],
                resultId: resId,
                subDeterminationId: sdId,
                valor: cols[3] || null,
                comentario: cols[4] || null,
                laboratoryId: LAB_ID,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch);
            imported += batch.length;
            batch = [];
            if (imported % 20000 === 0) {
                console.log(`Importados en esta corrida: ${imported}. Linea Excel: ${count}`);
            }
        }
    }

    if (batch.length > 0) {
        await insertBatch(batch);
    }
    console.log(`\nDONE. Total final en DB: ${await prisma.subResult.count()}`);
}

async function insertBatch(data) {
    try {
        await prisma.subResult.createMany({ data, skipDuplicates: true });
    } catch (e) {
        // En caso de fallar, limpiamos posibles caracteres extraños o nulos
        let cleanData = data.map(d => {
            return {
                ...d,
                valor: d.valor ? d.valor.replace(/\x00/g, '') : null,
                comentario: d.comentario ? d.comentario.replace(/\x00/g, '') : null,
            };
        });

        try {
            await prisma.subResult.createMany({ data: cleanData, skipDuplicates: true });
        } catch (e2) {
            // Fallback definitivo uno por uno
            for (const item of cleanData) {
                try { await prisma.subResult.create({ data: item }); } catch (err) { }
            }
        }
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

main().catch(err => { console.error('Fatal Error:', err); });
