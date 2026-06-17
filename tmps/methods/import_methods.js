const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

async function importMethods() {
    const csvFile = path.join(__dirname, 'metodos.csv');

    if (!fs.existsSync(csvFile)) {
        console.error('File not found:', csvFile);
        return;
    }

    const methods = [];

    fs.createReadStream(csvFile)
        .pipe(csv())
        .on('data', (row) => {
            methods.push({
                codigoExterno: row['codigoexterno'],
                nombre: row['Nombre'] || '',
                laboratoryId: LAB_ID
            });
        })
        .on('end', async () => {
            console.log(`Parsed ${methods.length} methods. Starting import...`);

            let count = 0;
            for (const method of methods) {
                try {
                    await prisma.method.upsert({
                        where: {
                            nombre_laboratoryId: {
                                nombre: method.nombre,
                                laboratoryId: LAB_ID
                            }
                        },
                        update: {
                            codigoExterno: method.codigoExterno
                        },
                        create: method
                    });
                    count++;
                } catch (err) {
                    console.error(`Error importing ${method.nombre}:`, err.message);
                }
            }

            console.log(`Finished! Total processed: ${count}`);
            await prisma.$disconnect();
        });
}

importMethods().catch(err => {
    console.error('Global error:', err);
    process.exit(1);
});
