const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
async function main() {
  const r = await prisma.externalRecord.findFirst({
    where: { nombreTabla: 'PRO Protocolos' }
  })
  console.log(JSON.stringify(r.datos, null, 2))
}
main().catch(console.error).finally(() => prisma.$disconnect())
