const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const LAB_ID = 'cmm58sbbt0000xw4pp6ynzgyi';

const additionalData = [
    {
        nombre: "Acto bioquimico Internacion",
        abreviatura: "AB",
        codigo: "1001",
        agregarSiempre: true,
        agregarEnUrgencia: false
    },
    {
        nombre: "Colector Orina Esteril",
        abreviatura: "Frasco Uro",
        codigo: "264",
        agregarSiempre: false,
        agregarEnUrgencia: false
    },
    {
        nombre: "Domicilio",
        abreviatura: "DOMICILIO",
        codigo: "",
        agregarSiempre: false,
        agregarEnUrgencia: false
    },
    {
        nombre: "Urgencia",
        abreviatura: "URGENCIA",
        codigo: "1200",
        agregarSiempre: false,
        agregarEnUrgencia: true
    }
];

async function main() {
    console.log(`Starting to insert additionals for lab ${LAB_ID}...`);
    let successCount = 0;
    let failCount = 0;

    for (const item of additionalData) {
        try {
            await prisma.additional.create({
                data: {
                    ...item,
                    laboratoryId: LAB_ID
                }
            });
            successCount++;
        } catch (e) {
            failCount++;
            console.error(`Failed to insert: ${item.nombre}. Error:`, e.message);
        }
    }

    console.log('--- DONE ---');
    console.log(`Successfully inserted: ${successCount}`);
    console.log(`Failed to insert: ${failCount}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
