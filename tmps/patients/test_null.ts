import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
    const lab = await prisma.laboratory.findFirst();
    if (!lab) return;

    console.log("Creando primer nulo...");
    await prisma.patient.create({
        data: {
            apellido: "Test1",
            nombre: "Test1",
            sexo: "M",
            tipoDocumento: "DNI",
            documento: null,
            fechaNacimiento: null,
            laboratoryId: lab.id
        }
    });

    console.log("Creando segundo nulo...");
    try {
        await prisma.patient.create({
            data: {
                apellido: "Test2",
                nombre: "Test2",
                sexo: "M",
                tipoDocumento: "DNI",
                documento: null,
                fechaNacimiento: null,
                laboratoryId: lab.id
            }
        });
        console.log("Exito!");
    } catch (e) {
        console.error("Fallo:", e);
    }

    await prisma.$disconnect();
}
test();
