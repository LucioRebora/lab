import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Checking for results with no effective section...");
    const results = await prisma.result.findMany({
        where: {
            asignado: false,
            sectionId: null,
            determination: { sectionId: null }
        },
        include: {
            determination: true
        }
    });

    console.log(`Found ${results.length} results.`);
    if (results.length > 0) {
        console.log(JSON.stringify(results.map(r => r.determination.nombre), null, 2));
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
