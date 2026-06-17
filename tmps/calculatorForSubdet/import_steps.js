const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';
const CSV_FILE = 'c:\\Users\\DEX\\Proyectos\\bioitia\\tmps\\calculatorForSubdet\\PasosCalcular.csv';

async function main() {
    console.log('Iniciando importación de CalculatorSteps...');

    // Cargar mapa de subdeterminaciones por codigoExterno para el laboratorio
    const subdets = await prisma.subDetermination.findMany({
        where: { laboratoryId: LAB_ID }
    });
    const subdetMap = new Map(subdets.map(s => [s.codigoExterno, s.id]));

    const stream = fs.createReadStream(CSV_FILE).pipe(csv());
    const steps = [];
    let count = 0;

    for await (const row of stream) {
        const extSubDetId = row.IDSubDeterminacion;
        const subdetId = subdetMap.get(extSubDetId);

        if (!subdetId) {
            // console.warn(`Subdeterminación no encontrada para codigoExterno: ${extSubDetId}. Saltando...`);
            continue;
        }

        steps.push({
            codigoExterno: row.IDPasoCalcular,
            subDeterminationId: subdetId,
            tipoOperacion: row.TipoOperacion,
            argumentoNumerico: parseFloat(row.ArgumentoNumerico) || 0,
            argumentoIDSubDete: row.ArgumentoIDSubDete || null,
            laboratoryId: LAB_ID
        });

        count++;
    }

    console.log(`Leídos ${steps.length} pasos válidos de ${count} filas. Insertando...`);

    // Insertar en batches
    const batchSize = 100;
    for (let i = 0; i < steps.length; i += batchSize) {
        const batch = steps.slice(i, i + batchSize);
        await prisma.calculatorStep.createMany({
            data: batch,
            skipDuplicates: true
        });
        if (i % 500 === 0) console.log(`Insertados: ${i}...`);
    }

    // Actualizar campo 'calcular' en SubDetermination si tiene pasos
    const subdetIdsWithSteps = [...new Set(steps.map(s => s.subDeterminationId))];
    await prisma.subDetermination.updateMany({
        where: { id: { in: subdetIdsWithSteps } },
        data: { calcular: true }
    });

    console.log('Importación de CalculatorSteps finalizada.');
    console.log(`- Total insertados/procesados: ${steps.length}`);
    console.log(`- Subdeterminaciones marcadas para calcular: ${subdetIdsWithSteps.length}`);

    await prisma.$disconnect();
}

main().catch(console.error);
