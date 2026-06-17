const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("=== DIAGNÓSTICO DE FALTANTES ===");

    const rl = readline.createInterface({
        input: fs.createReadStream('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv'),
        crlfDelay: Infinity
    });

    let linesWithValidId = 0;
    let missingExamples = [];
    let count = 0;
    let totalLines = 0;

    // Check 1000 random samples from the middle/end to see if they exist
    // Actually, let's do a more systematic count of how many lines START a record.

    console.log("Analizando CSV para identificar inicios de registros reales...");

    for await (const line of rl) {
        totalLines++;
        if (totalLines === 1) continue;

        // A line starts a record if it begins with a number followed by a comma
        if (/^\d+,/.test(line)) {
            linesWithValidId++;
        }
    }

    console.log(`\n- Líneas totales en CSV: ${totalLines}`);
    console.log(`- Líneas que parecen ser inicios de registros (Numeric ID): ${linesWithValidId}`);

    const dbCount = await prisma.subResult.count();
    console.log(`- Registros actuales en la Base de Datos: ${dbCount}`);

    const diff = linesWithValidId - dbCount;
    console.log(`- Diferencia real (IDs válidos - DB): ${diff}`);

    if (diff > 0) {
        console.log(`\nBuscando 5 ejemplos de IDs que están en el CSV pero no en la BD...`);
        const rl2 = readline.createInterface({
            input: fs.createReadStream('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv'),
            crlfDelay: Infinity
        });

        let found = 0;
        let lCount = 0;
        for await (const line of rl2) {
            lCount++;
            if (lCount === 1) continue;
            const match = line.match(/^(\d+),/);
            if (match) {
                const id = match[1];
                const exists = await prisma.subResult.findUnique({ where: { codigoExterno: id } });
                if (!exists) {
                    missingExamples.push({ id, line: lCount, content: line.slice(0, 100) });
                    found++;
                    if (found >= 5) break;
                }
            }
            if (lCount % 100000 === 0) process.stdout.write(`Escaneado: ${lCount}...\r`);
        }
    }

    console.log("\n\n--- EJEMPLOS DE FALTANTES ---");
    missingExamples.forEach(ex => {
        console.log(`ID: ${ex.id} | Línea: ${ex.line} | Contenido: ${ex.content}...`);
    });

    await prisma.$disconnect();
}

main();
