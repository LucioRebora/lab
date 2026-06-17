const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

async function importDeterminations() {
    const csvFile = path.join(__dirname, 'determinations.csv');

    if (!fs.existsSync(csvFile)) {
        console.error('File not found:', csvFile);
        return;
    }

    // Load related data maps
    const methods = await prisma.method.findMany({ where: { laboratoryId: LAB_ID } });
    const methodMap = new Map(methods.map(m => [m.codigoExterno, m.id]));

    const aspects = await prisma.aspect.findMany({ where: { laboratoryId: LAB_ID } });
    const aspectMap = new Map(aspects.map(a => [a.codigoExterno, a.id]));

    const sections = await prisma.section.findMany({ where: { laboratoryId: LAB_ID } });
    const sectionMap = new Map(sections.map(s => [s.codigoExterno, s.id]));

    console.log(`Loaded maps: ${methodMap.size} methods, ${aspectMap.size} aspects, ${sectionMap.size} sections.`);

    const items = [];

    // Using simple approach to parse since it has no headers
    fs.createReadStream(csvFile)
        .pipe(csv({ headers: false }))
        .on('data', (row) => {
            // row is an object with keys "0", "1", etc.
            const idDet = row[0];
            if (!idDet || idDet.trim() === '') return;

            const name = row[1];
            const abreviatura = row[2];
            const idMetodo = row[4];
            const idAspecto = row[5];
            const codigo = row[6];
            const mensajeIngreso = row[8];
            const idSeccion = row[11];

            items.push({
                codigoExterno: idDet,
                nombre: name || '',
                abreviatura: abreviatura || null,
                codigo: codigo || null,
                mensajeIngreso: mensajeIngreso || null,
                methodId: methodMap.get(idMetodo) || null,
                aspectId: aspectMap.get(idAspecto) || null,
                sectionId: sectionMap.get(idSeccion) || null,
                laboratoryId: LAB_ID
            });
        })
        .on('end', async () => {
            console.log(`Parsed ${items.length} determinations. Starting import...`);

            let count = 0;
            for (const item of items) {
                try {
                    await prisma.determination.upsert({
                        where: {
                            nombre_codigoExterno_laboratoryId: {
                                nombre: item.nombre,
                                codigoExterno: item.codigoExterno,
                                laboratoryId: LAB_ID
                            }
                        },
                        update: {
                            codigoExterno: item.codigoExterno,
                            abreviatura: item.abreviatura,
                            codigo: item.codigo,
                            mensajeIngreso: item.mensajeIngreso,
                            methodId: item.methodId,
                            aspectId: item.aspectId,
                            sectionId: item.sectionId
                        },
                        create: item
                    });
                    count++;
                    if (count % 100 === 0) console.log(`Processed ${count}...`);
                } catch (err) {
                    console.error(`Error importing ${item.nombre}:`, err.message);
                }
            }

            console.log(`Finished! Total processed: ${count}`);
            await prisma.$disconnect();
        });
}

importDeterminations().catch(err => {
    console.error('Global error:', err);
    process.exit(1);
});
