import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Listing all sections...");
    const sections = await prisma.section.findMany({
        select: { id: true, nombre: true, hojaTrabajo: true }
    });
    console.log(JSON.stringify(sections, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
