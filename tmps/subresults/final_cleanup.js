const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const BATCH_SIZE = 2000;
const LOG_EVERY = 25000;

async function runImport(partFile, partLabel) {
    console.log(`\n==========================================`);
    console.log(`INICIANDO ${partLabel}: ${partFile}`);
    console.log(`==========================================`);

    if (!fs.existsSync(partFile)) {
        console.error(`Error: No existe el archivo ${partFile}`);
        return;
    }

    console.log('Cargando relaciones...');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const resultMap = new Map();
    const results = await prisma.result.findMany({ select: { id: true, codigoExterno: true } });
    results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });

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

        const extSubId = cols[0];
        const extResId = cols[1];
        const extSDId = cols[2];
        const valor = cols[3];
        const comentario = cols[4];

        const resId = resultMap.get(extResId);
        const sdId = subDetMap.get(extSDId);

        if (resId && sdId) {
            batch.push({
                codigoExterno: extSubId,
                resultId: resId,
                subDeterminationId: sdId,
                valor: valor ? valor.replace(/\x00/g, '') : null,
                comentario: comentario ? comentario.replace(/\x00/g, '') : null,
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
                console.log(`${partLabel}: Procesadas ${count} líneas. Total guardados nuevos en este paso: ${saved}`);
            }
        }
    }

    if (batch.length > 0) {
        const res = await prisma.subResult.createMany({ data: batch, skipDuplicates: true });
        saved += res.count;
    }

    console.log(`\n--- ${partLabel} FINALIZADA ---`);
    console.log(`Leídas: ${count}, Guardadas nuevas: ${saved}`);
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
    console.log("INICIANDO LIMPIEZA FINAL DE DATOS");
    try {
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part1.csv', 'PARTE 1');
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part2.csv', 'PARTE 2');

        const count = await prisma.subResult.count();
        console.log(`\nFINALIZADO. Total en BD: ${count}`);
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
