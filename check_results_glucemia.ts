import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Checking results for GLUCEMIA...");
    const results = await prisma.result.findMany({
        where: {
            determination: { nombre: { contains: "GLUCEMIA", mode: "insensitive" } },
            asignado: false
        },
        include: {
            section: true,
            determination: { include: { section: true } }
        }
    });

    console.log(JSON.stringify(results, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
