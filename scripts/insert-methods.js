const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const laboratoryId = "cmm58sbbt0000xw4pp6ynzgyi";

const rawData = `Turbidimétrico
Turbidimétrico cinético UV
UCH50
Varios
Wainberg Florencia N.
Westergreen
Western Blot
Winzler modificado
Ziehl Nielsen`;

async function main() {
    const lines = rawData.split('\n').filter(l => l.trim().length > 0);
    console.log('Total methods to evaluate:', lines.length);

    let insertedCount = 0;
    for (const line of lines) {
        const nombre = line.trim();

        if (!nombre) continue;

        try {
            const existing = await prisma.method.findFirst({
                where: {
                    nombre: nombre,
                    laboratoryId: laboratoryId
                }
            });

            if (!existing) {
                await prisma.method.create({
                    data: {
                        nombre,
                        laboratoryId
                    }
                });
                insertedCount++;
            }
        } catch (e) {
            console.error('Error inserting', line, e.message);
        }
    }

    console.log('Successfully inserted ' + insertedCount + ' new methods.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
