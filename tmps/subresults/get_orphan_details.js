const fs = require('fs');
const readline = require('readline');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    console.log("=== BUSCANDO 3 EJEMPLOS DE HUÉRFANOS (SIN RESULTADO PADRE) ===");

    // Lista de IDs de Resultados que ya sabemos que faltan por el diagnóstico anterior
    const targetParents = ['391839', '391847', '391854'];

    const rl = readline.createInterface({
        input: fs.createReadStream('C:/Users/DEX/Proyectos/bioitia/tmps/subresults/SubResultados.csv'),
        crlfDelay: Infinity
    });

    let found = 0;
    let count = 0;

    for await (const line of rl) {
        count++;
        if (count === 1) continue;

        const match = line.match(/^(\d+),(\d+),(\d+),(.*),(.*)$/);
        if (match) {
            const subResId = match[1];
            const resId = match[2];
            const subDetId = match[3];
            const valor = match[4];

            if (targetParents.includes(resId)) {
                console.log(`\nEjemplo ${found + 1}:`);
                console.log(`- Línea CSV: ${count}`);
                console.log(`- ID SubResultado: ${subResId}`);
                console.log(`- ID Resultado PADRE: ${resId} (ESTE NO EXISTE EN BD)`);
                console.log(`- ID SubDeterminación: ${subDetId}`);
                console.log(`- Valor: ${valor}`);
                console.log(`- Contenido original: ${line.slice(0, 100)}...`);

                found++;
                if (found >= 3) break;
            }
        }
    }

    await prisma.$disconnect();
}

main();
