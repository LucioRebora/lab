const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

async function importAspects() {
    const csvFile = path.join(__dirname, 'aspects.csv');

    if (!fs.existsSync(csvFile)) {
        console.error('File not found:', csvFile);
        return;
    }

    const aspects = [];

    fs.createReadStream(csvFile)
        .pipe(csv())
        .on('data', (row) => {
            aspects.push({
                codigoExterno: row['codigoExterno'],
                nombre: row['Nombre'] || '',
                descripcion: row['Descripcion'] || '',
                laboratoryId: LAB_ID
            });
        })
        .on('end', async () => {
            console.log(`Parsed ${aspects.length} aspects. Starting import...`);

            let count = 0;
            for (const aspect of aspects) {
                try {
                    await prisma.aspect.upsert({
                        where: {
                            nombre_laboratoryId: {
                                nombre: aspect.nombre,
                                laboratoryId: LAB_ID
                            }
                        },
                        update: {
                            codigoExterno: aspect.codigoExterno,
                            descripcion: aspect.descripcion
                        },
                        create: aspect
                    });
                    count++;
                } catch (err) {
                    console.error(`Error importing ${aspect.nombre}:`, err.message);
                }
            }

            console.log(`Finished! Total processed: ${count}`);
            await prisma.$disconnect();
        });
}

importAspects().catch(err => {
    console.error('Global error:', err);
    process.exit(1);
});
