const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const ps = await prisma.protocol.findMany({ select: { numeroSecuencial: true, createdAt: true }, take: 50 })
  ps.forEach(p => console.log(`${p.numeroSecuencial}: ${p.createdAt.toISOString()}`))
}
main().catch(console.error).finally(() => prisma.$disconnect())
