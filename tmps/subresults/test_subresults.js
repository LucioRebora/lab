const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CSV_PATH = 'C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv';
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const BATCH_SIZE = 1000;

async function main() {
    console.log('--- SubResults Import Debugger ---');

    console.log('1. Caching mapping data...');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const resultMap = new Map();
    const results = await prisma.result.findMany({ select: { id: true, codigoExterno: true } });
    results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });

    console.log(`Cached ${subDetMap.size} SubDets and ${resultMap.size} Results.`);

    const rl = readline.createInterface({ input: fs.createReadStream(CSV_PATH), crlfDelay: Infinity });

    let count = 0;
    let validRows = 0;
    let missingRes = 0;
    let missingSD = 0;
    let inserted = 0;
    let batch = [];

    // Check DB count to skip
    const currentDBCount = await prisma.subResult.count();
    console.log('Current DB Count:', currentDBCount);

    const skipThreshold = Math.max(0, currentDBCount - 5000);

    for await (const line of rl) {
        count++;
        if (count % 100000 === 0) {
            console.log(`Read ${count} lines... Valid: ${validRows}, MissingRes: ${missingRes}, MissingSD: ${missingSD}`);
        }

        if (count === 1) continue;
        if (count <= skipThreshold) continue;

        const cols = parseCsvLine(line);
        if (cols.length < 3) continue;

        const extResId = cols[1];
        const extSDId = cols[2];

        const resId = resultMap.get(extResId);
        const sdId = subDetMap.get(extSDId);

        if (!resId) missingRes++;
        if (!sdId) missingSD++;

        if (resId && sdId) {
            validRows++;
            batch.push({
                codigoExterno: cols[0],
                resultId: resId,
                subDeterminationId: sdId,
                valor: cols[3] || null,
                comentario: cols[4] || null,
                laboratoryId: LAB_ID
            });
        }

        if (batch.length >= BATCH_SIZE) {
            try {
                await prisma.subResult.createMany({ data: batch, skipDuplicates: true });
                inserted += batch.length;
                console.log(`Inserted batch. Total inserted this run: ${inserted}. At CSV line: ${count}`);
            } catch (e) {
                console.log(`Error at line ${count}: ${e.message.split('\n')[0]}`);
            }
            batch = [];
        }
    }

    if (batch.length > 0) {
        try {
            await prisma.subResult.createMany({ data: batch, skipDuplicates: true });
            inserted += batch.length;
        } catch (e) { }
    }

    console.log(`\nDONE. Total read: ${count}. Valid: ${validRows}. Inserted: ${inserted}`);
    console.log(`DB Count final: ${await prisma.subResult.count()}`);
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

main().catch(console.error);
