const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

async function importSections() {
    const csvFile = path.join(__dirname, 'sections.csv');

    if (!fs.existsSync(csvFile)) {
        console.error('File not found:', csvFile);
        return;
    }

    const sections = [];

    fs.createReadStream(csvFile)
        .pipe(csv())
        .on('data', (row) => {
            sections.push({
                codigoExterno: row['codigoExterno'],
                nombre: row['Nombre'] || '',
                hojaTrabajo: row['UsarHDT'] || '',
                etiqueta: row['UsarETQ'] || '',
                laboratoryId: LAB_ID
            });
        })
        .on('end', async () => {
            console.log(`Parsed ${sections.length} sections. Starting import...`);

            let count = 0;
            for (const section of sections) {
                try {
                    await prisma.section.upsert({
                        where: {
                            nombre_laboratoryId: {
                                nombre: section.nombre,
                                laboratoryId: LAB_ID
                            }
                        },
                        update: {
                            codigoExterno: section.codigoExterno,
                            hojaTrabajo: section.hojaTrabajo,
                            etiqueta: section.etiqueta
                        },
                        create: section
                    });
                    count++;
                } catch (err) {
                    console.error(`Error importing ${section.nombre}:`, err.message);
                }
            }

            console.log(`Finished! Total processed: ${count}`);
            await prisma.$disconnect();
        });
}

importSections().catch(err => {
    console.error('Global error:', err);
    process.exit(1);
});
