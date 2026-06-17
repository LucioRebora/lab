const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check91077() {
  const pr = await prisma.protocol.findFirst({
    where: { numeroSecuencial: "91077" }
  });
  console.log(`Protocol 91077: numeroSecuencial=${pr.numeroSecuencial}, codigoExterno=${pr.codigoExterno}`);
}

check91077().finally(() => prisma.$disconnect());
