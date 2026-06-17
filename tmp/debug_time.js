const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const p = await prisma.protocol.findFirst({
    where: { numeroSecuencial: '92927' }
  })
  console.log('92927:', p?.createdAt, p?.updatedAt)
  const p2 = await prisma.protocol.findFirst({
    where: { numeroSecuencial: '92928' }
  })
  console.log('92928:', p2?.createdAt, p2?.updatedAt)
}
main().catch(console.error).finally(() => prisma.$disconnect())
