const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const protocols = await prisma.protocol.findMany({
        where: {
            numeroSecuencial: { startsWith: '20260318' }
        },
        include: {
            patient: true
        }
    });
    console.log(JSON.stringify(protocols, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
