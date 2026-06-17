const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("=== ANÁLISIS DE PADRES FALTANTES ===");

    // Cache de Results en BD
    const resultSet = new Set();
    const batchSize = 100000;
    let skipResults = 0;
    while (true) {
        const rBatch = await prisma.result.findMany({ select: { codigoExterno: true }, take: batchSize, skip: skipResults });
        if (rBatch.length === 0) break;
        rBatch.forEach(r => { if (r.codigoExterno) resultSet.add(r.codigoExterno.toString()); });
        skipResults += batchSize;
        process.stdout.write(`...${resultSet.size} Resultados en BD cargados\r`);
    }
    console.log(`\nIntegridad BD: ${resultSet.size} Results.`);

    const rl = readline.createInterface({
        input: fs.createReadStream('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv'),
        crlfDelay: Infinity
    });

    const missingParents = new Map();
    let count = 0;

    for await (const line of rl) {
        count++;
        if (count === 1) continue;
        const match = line.match(/^\d+,(\d+),/);
        if (match) {
            const resId = match[1];
            if (!resultSet.has(resId)) {
                missingParents.set(resId, (missingParents.get(resId) || 0) + 1);
            }
        }
        if (count % 1000000 === 0) console.log(`Procesadas ${count} líneas...`);
    }

    console.log(`\nSe encontraron ${missingParents.size} IDs de Resultado que faltan en la BD.`);

    // Sort by frequency
    const sorted = [...missingParents.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
    console.log("\nTop 20 Resultados faltantes con más sub-resultados asociados:");
    sorted.forEach(([id, count]) => {
        console.log(`- ResultID Externo: ${id} | Faltan ${count} sub-resultados para este padre.`);
    });

    await prisma.$disconnect();
}

main();
