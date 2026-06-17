const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const CSV_PATH = 'C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv';
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

async function main() {
    console.log('--- Quick Error Check ---');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const resultMap = new Map();
    const results = await prisma.result.findMany({ select: { id: true, codigoExterno: true } });
    results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });

    const rl = readline.createInterface({ input: fs.createReadStream(CSV_PATH), crlfDelay: Infinity });

    let count = 0;
    let batch = [];

    // Line where the error starts: ~1003472
    const TARGET = 1000000;

    for await (const line of rl) {
        count++;
        if (count < TARGET) continue;

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

        if (batch.length >= 1000) {
            try {
                await prisma.subResult.createMany({ data: batch, skipDuplicates: true });
                console.log(`[Success] Batch starting at line ${count - batch.length} OK.`);
            } catch (e) {
                console.log(`\n!!! ERROR at batch ending on line ${count} !!!`);
                console.log(e.message);

                // Let's identify exactly which record triggers it:
                for (let i = 0; i < batch.length; i++) {
                    try {
                        await prisma.subResult.create({ data: batch[i] });
                    } catch (err) {
                        if (!err.message.includes('Unique constraint failed')) {
                            console.log(`Failed on record:`, batch[i]);
                            console.log(`Specific Error:`, err.message);
                            break;
                        }
                    }
                }
                process.exit(1);
            }
            batch = [];
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

main().catch(console.error);
