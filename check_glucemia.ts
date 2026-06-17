import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Searching for GLUCEMIA...");
    const dets = await prisma.determination.findMany({
        where: {
            nombre: { contains: "GLUCEMIA", mode: "insensitive" }
        },
        include: {
            section: true
        }
    });

    console.log(JSON.stringify(dets, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
