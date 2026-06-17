const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    try {
        const labs = await prisma.laboratory.findMany();
        if (labs.length === 0) {
            console.log("No hay laboratorios.");
            return;
        }

        const laboratoryId = labs[0].id;
        console.log("Usando laboratoryId:", laboratoryId);

        // Crear area default
        const settingArea = await prisma.setting.upsert({
            where: {
                key_laboratoryId: {
                    key: "DEFAULT_PHONE_AREA",
                    laboratoryId: laboratoryId
                }
            },
            update: {
                value: "3446",
                description: "Código de área telefónico por defecto."
            },
            create: {
                key: "DEFAULT_PHONE_AREA",
                value: "3446",
                description: "Código de área telefónico por defecto.",
                laboratoryId: laboratoryId
            }
        });

        // Crear pais default
        const settingPais = await prisma.setting.upsert({
            where: {
                key_laboratoryId: {
                    key: "DEFAULT_PHONE_COUNTRY",
                    laboratoryId: laboratoryId
                }
            },
            update: {
                value: "+54 9",
                description: "Código de país telefónico por defecto."
            },
            create: {
                key: "DEFAULT_PHONE_COUNTRY",
                value: "+54 9",
                description: "Código de país telefónico por defecto.",
                laboratoryId: laboratoryId
            }
        });

        console.log("Settings creadas/actualizadas:", settingArea, settingPais);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
