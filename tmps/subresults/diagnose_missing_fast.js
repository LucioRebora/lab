const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("=== DIAGNÓSTICO DE ALTA VELOCIDAD DE FALTANTES ===");

    // 1. Cargando todos los IDs existentes en BD
    console.log("1. Cargando IDs de BD en memoria (cache)...");
    const existingIds = new Set();
    const batchSize = 100000;
    let skip = 0;
    while (true) {
        const srBatch = await prisma.subResult.findMany({ select: { codigoExterno: true }, take: batchSize, skip });
        if (srBatch.length === 0) break;
        srBatch.forEach(s => { if (s.codigoExterno) existingIds.add(s.codigoExterno.toString()); });
        skip += batchSize;
        process.stdout.write(`...${existingIds.size} IDs cargados\r`);
    }
    console.log(`\nCache de DB listo con ${existingIds.size} registros.`);

    // 2. Cargando diccionarios de relaciones (Results y SubDets)
    console.log("2. Cargando diccionarios de relaciones...");
    const subDetSet = new Set();
    const resultSet = new Set();

    const allSubDets = await prisma.subDetermination.findMany({ select: { codigoExterno: true } });
    allSubDets.forEach(sd => { if (sd.codigoExterno) subDetSet.add(sd.codigoExterno.toString()); });

    let skipResults = 0;
    while (true) {
        const rBatch = await prisma.result.findMany({ select: { codigoExterno: true }, take: batchSize, skip: skipResults });
        if (rBatch.length === 0) break;
        rBatch.forEach(r => { if (r.codigoExterno) resultSet.add(r.codigoExterno.toString()); });
        skipResults += batchSize;
        process.stdout.write(`...${resultSet.size} Resultados cargados\r`);
    }
    console.log(`\nCache de Relaciones: ${subDetSet.size} SubDets, ${resultSet.size} Results.`);

    // 3. Escaneo del CSV para identificar cada faltante y el porqué
    console.log("3. Analizando CSV para identificar faltantes...");
    const rl = readline.createInterface({
        input: fs.createReadStream('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv'),
        crlfDelay: Infinity
    });

    let totalCsvLines = 0;
    let validIdsInCsv = 0;
    let missingTotal = 0;
    let missingCauseNoResult = 0;
    let missingCauseNoSubDet = 0;
    let missingNoApparentReason = 0; // The real ones we need to insert

    let examples = [];

    for await (const line of rl) {
        totalCsvLines++;
        if (totalCsvLines === 1) continue;

        const match = line.match(/^(\d+),(\d+)?,(\d+)?/);
        if (!match) continue; // No es un inicio de registro real

        validIdsInCsv++;
        const subResId = (match[1] || "").trim();
        const resId = (match[2] || "").trim();
        const sdId = (match[3] || "").trim();

        if (!existingIds.has(subResId)) {
            missingTotal++;

            let cause = "";
            if (!resId || !resultSet.has(resId)) {
                missingCauseNoResult++;
                cause = "No existe el Resultado padre (" + (resId || 'NULO') + ")";
            } else if (!sdId || !subDetSet.has(sdId)) {
                missingCauseNoSubDet++;
                cause = "No existe la SubDeterminación (" + (sdId || 'NULO') + ")";
            } else {
                missingNoApparentReason++;
                cause = "Registro válido para migrar (no está en BD)";
                if (examples.length < 10) examples.push({ id: subResId, line: totalCsvLines, content: line.slice(0, 100), cause });
            }
        }

        if (totalCsvLines % 200000 === 0) process.stdout.write(`Línea ${totalCsvLines}...\r`);
    }

    console.log(`\n\n=== REPORTE FINAL ===`);
    console.log(`- Líneas en CSV: ${totalCsvLines}`);
    console.log(`- Inicios de registrados encontrados: ${validIdsInCsv}`);
    console.log(`- Registros existentes en DB: ${existingIds.size}`);
    console.log(`- Faltantes totales encontrados: ${missingTotal}`);
    console.log(`  - No migrados porque no hay Resultado padre: ${missingCauseNoResult}`);
    console.log(`  - No migrados porque no hay SubDeterminación: ${missingCauseNoSubDet}`);
    console.log(`  - LISTOS PARA MIGRAR (validos): ${missingNoApparentReason}`);

    console.log(`\n--- PRIMEROS 10 EJEMPLOS PARA MIGRAR ---`);
    examples.forEach(ex => {
        console.log(`- ID: ${ex.id} | Línea: ${ex.line} | ${ex.cause}`);
        console.log(`  Contenido: ${ex.content}`);
    });

    await prisma.$disconnect();
}

main();
