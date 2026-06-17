import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function count() {
    const total = await prisma.patient.count();
    const nullDocs = await prisma.patient.count({ where: { documento: null } });
    const nullDates = await prisma.patient.count({ where: { fechaNacimiento: null } });
    console.log(`Total: ${total}, Null Docs: ${nullDocs}, Null Dates: ${nullDates}`);
    await prisma.$disconnect();
}
count();
