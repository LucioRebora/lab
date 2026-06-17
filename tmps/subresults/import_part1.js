const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const PART_FILE = 'C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados_part1.csv';
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const BATCH_SIZE = 2500;

async function main() {
    console.log(`--- Iniciando importación de ${PART_FILE} ---`);

    console.log('1. Cargando relaciones en memoria (SubDeterminaciones y Resultados)...');
    const subDetMap = new Map();
    const subDets = await prisma.subDetermination.findMany({ select: { id: true, codigoExterno: true } });
    subDets.forEach(sd => { if (sd.codigoExterno) subDetMap.set(sd.codigoExterno.toString(), sd.id); });

    const resultMap = new Map();
    const results = await prisma.result.findMany({ select: { id: true, codigoExterno: true } });
    results.forEach(r => { if (r.codigoExterno) resultMap.set(r.codigoExterno.toString(), r.id); });

    console.log(`Cache listo: ${subDetMap.size} SubDets y ${resultMap.size} Results.`);

    const rl = readline.createInterface({
        input: fs.createReadStream(PART_FILE),
        crlfDelay: Infinity
    });

    let count = 0;
    let validRows = 0;
    let inserted = 0;
    let batch = [];

    // Si ya probamos subiendo antes, muchos de la parte 1 podrían estar repetidos. 
    // Prisma con skipDuplicates se encargará silenciosamente, pero lo mostraremos en consola.

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

            // Mostrar log cada cierto tiempo para no ensuciar la terminal
            if (inserted % 25000 === 0) {
                console.log(`Lote insertado... Llevamos guardados: ${inserted} / ${validRows} leídos.`);
            }
        }
    }

    // Insertamos el remanente
    if (batch.length > 0) {
        await insertBatch(batch);
        inserted += batch.length;
    }

    console.log(`\n--- IMPORTACIÓN DE PARTE 1 FINALIZADA ---`);
    console.log(`Total de filas leídas del CSV: ${count}`);
    console.log(`Filas válidas con referencias: ${validRows}`);
    console.log(`Peticiones enviadas a BD: ${inserted}`);
    console.log(`(Nota: si el número en base de datos no sube mucho, es porque la Parte 1 ya fue importada anteriormente)`);
}

async function insertBatch(data) {
    try {
        await prisma.subResult.createMany({ data, skipDuplicates: true });
    } catch (e) {
        // En caso extremo de bloqueo, intentamos uno por uno y capturamos errores fatales
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

main().catch(err => console.error('\nError Crítico:', err));
