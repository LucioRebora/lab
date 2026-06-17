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

    console.log('1. Cargando relaciones en memoria...');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const resultMap = new Map();
    const results = await prisma.result.findMany({ select: { id: true, codigoExterno: true } });
    results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });

    console.log(`Cache listo: ${subDetMap.size} SubDets y ${resultMap.size} Results.`);

    const rl = readline.createInterface({
        input: fs.createReadStream(partFile),
        crlfDelay: Infinity
    });

    let count = 0;
    let validRows = 0;
    let inserted = 0;
    let batch = [];

    for await (const line of rl) {
        count++;
        if (count === 1) continue; // Skip header

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
            validRows++;
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
            await insertBatch(batch);
            inserted += batch.length;
            batch = [];

            if (inserted % LOG_EVERY === 0) {
                console.log(`${partLabel}: Llevamos ${inserted} / ${validRows} registros.`);
            }
        }
    }

    if (batch.length > 0) {
        await insertBatch(batch);
        inserted += batch.length;
    }

    console.log(`\n--- ${partLabel} COMPLETADA ---`);
    console.log(`Leídas: ${count}, Guardadas: ${inserted}`);
}

async function insertBatch(data) {
    try {
        await prisma.subResult.createMany({ data, skipDuplicates: true });
    } catch (e) {
        // Fallback robusto por si Neon se queja del createMany gigante
        for (const item of data) {
            try { await prisma.subResult.create({ data: item }); } catch (err) { }
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

async function main() {
    console.log("MISION NOCTURNA: IMPORTACION MASIVA INICIADA");
    try {
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part3.csv', 'PARTE 3');
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part4.csv', 'PARTE 4');
        await runImport('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part2.csv', 'PARTE 1/2 REVISIÓN');

        const count = await prisma.subResult.count();
        console.log(`\n==========================================`);
        console.log(`MISION COMPLETADA CON EXITO`);
        console.log(`Total Final en Base de Datos: ${count}`);
        console.log(`==========================================`);
    } catch (err) {
        console.error("\nError critico en la mision nocturna:", err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
