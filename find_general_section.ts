import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Searching for any section with name 'General'...");
    const sections = await prisma.section.findMany({
        where: { nombre: { contains: "General", mode: "insensitive" } }
    });
    console.log(JSON.stringify(sections, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
