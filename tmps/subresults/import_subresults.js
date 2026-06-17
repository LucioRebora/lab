const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CSV_PATH = 'C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv';
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const BATCH_SIZE = 1000;

async function main() {
    console.log('--- SubResults Import Debug Version ---');

    console.log('1. Caching mapping data...');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const resultMap = new Map();
    const results = await prisma.result.findMany({ select: { id: true, codigoExterno: true } });
    results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });

    const currentCount = await prisma.subResult.count();
    console.log(`2. Starting at current count: ${currentCount}`);

    const rl = readline.createInterface({ input: fs.createReadStream(CSV_PATH), crlfDelay: Infinity });

    let count = 0;
    let imported = 0;
    let batch = [];
    const skipThreshold = Math.max(0, currentCount - 2000);

    for await (const line of rl) {
        count++;
        if (count === 1) continue;

        if (count <= skipThreshold) {
            continue;
        }

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
                laboratoryId: LAB_ID
            });
        }

        if (batch.length >= BATCH_SIZE) {
            await insertBatch(batch, count);
            imported += batch.length;
            batch = [];
            process.stdout.write(`\rabsolute CSV line: ${count} | Imported this run: ${imported}`);
        }
    }

    if (batch.length > 0) {
        await insertBatch(batch, count);
        imported += batch.length;
    }

    console.log('\n--- Final ---');
    console.log(`DB Count: ${await prisma.subResult.count()}`);
}

async function insertBatch(data, lineNum) {
    try {
        await prisma.subResult.createMany({ data, skipDuplicates: true });
    } catch (e) {
        console.error(`\nBatch failed at line ~${lineNum}. Falling back to single inserts. Error msg:`, e.message.substring(0, 100));
        let success = 0;
        let fails = 0;
        for (const item of data) {
            try {
                await prisma.subResult.create({ data: item });
                success++;
            } catch (err) {
                fails++;
            }
        }
        console.log(`Fallback results: ${success} inserted, ${fails} failed.`);
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

main().catch(err => { console.error('\nFatal Error:', err); process.exit(1); });
