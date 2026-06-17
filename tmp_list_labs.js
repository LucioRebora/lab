const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const labs = await prisma.laboratory.findMany();
    console.log('Labs:', labs.map(l => ({ id: l.id, nombre: l.nombre })));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
