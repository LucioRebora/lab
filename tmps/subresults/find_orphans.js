const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log('1. Cargando todos los Result IDs en memoria (para evitar saturar la BD)...');
    const resultMap = new Set();
    let skip = 0;
    const batch = 50000;

    while (true) {
        const results = await prisma.result.findMany({
            select: { codigoExterno: true },
            take: batch,
            skip: skip
        });
        if (results.length === 0) break;
        results.forEach(r => { if (r.codigoExterno) resultMap.add(r.codigoExterno.toString()); });
        skip += batch;
        process.stdout.write(`...${resultMap.size} cargados\r`);
    }

    console.log(`\nCache listo con ${resultMap.size} IDs.`);

    const rl = readline.createInterface({
        input: fs.createReadStream('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv'),
        crlfDelay: Infinity
    });

    let count = 0;
    let orphansFound = 0;

    console.log('2. Buscando huérfanos en el CSV...');
    for await (const line of rl) {
        count++;
        if (count === 1) continue;

        const cols = line.split(',');
        const extResId = (cols[1] || "").trim();

        if (extResId && !resultMap.has(extResId)) {
            orphansFound++;
            console.log(`\nEjemplo ${orphansFound}:`);
            console.log(`- Línea CSV: ${count}`);
            console.log(`- Contenido: ${line}`);
            console.log(`- ID de Resultado que NO existe: ${extResId}`);
            if (orphansFound === 3) break;
        }

        if (count % 100000 === 0) process.stdout.write(`Escaneadas ${count} líneas...\r`);
    }

    console.log('\nEscaneo finalizado.');
    await prisma.$disconnect();
}

main();
