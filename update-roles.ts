import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({
    where: {
      role: 'ADMIN'
    },
    data: {
      role: 'LAB_ADMIN'
    }
  });
  console.log("Roles updated.");
}

main().catch(e => {
  console.error(e);
}).finally(async () => {
  await prisma.$disconnect();
});
