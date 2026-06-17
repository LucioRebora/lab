const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testApiQuery() {
  const search = "92926";
  console.log(`Testing API query for "${search}"...`);
  
  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { apellido: { contains: search, mode: "insensitive" } },
        { nombre: { contains: search, mode: "insensitive" } },
        { documento: { contains: search } },
        { protocols: { some: { numeroSecuencial: { contains: search, mode: "insensitive" } } } }
      ]
    },
    include: { protocols: { take: 1 } }
  });

  console.log(`Results: ${patients.length}`);
  patients.forEach(p => {
    console.log(`- ${p.apellido}, ${p.nombre} (ID: ${p.id}, Protocols: ${p.protocols.length})`);
  });
}

testApiQuery().finally(() => prisma.$disconnect());
