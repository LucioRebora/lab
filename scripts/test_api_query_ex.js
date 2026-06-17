const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testApiQueryEx() {
  const search = "92926";
  console.log(`Testing API query for "${search}"...`);
  
  const patients = await prisma.patient.findMany({
    where: {
      OR: [
        { apellido: { contains: search, mode: "insensitive" } },
        { nombre: { contains: search, mode: "insensitive" } },
        { documento: { contains: search } },
        { codigoExterno: { contains: search, mode: "insensitive" } },
        { protocols: { some: { 
            OR: [
                { numeroSecuencial: { contains: search, mode: "insensitive" } },
                { codigoExterno: { contains: search, mode: "insensitive" } }
            ]
        } } }
      ]
    },
    include: { protocols: true }
  });

  console.log(`Results: ${patients.length}`);
  patients.forEach(p => {
    console.log(`- ${p.apellido}, ${p.nombre} (ID: ${p.id})`);
    p.protocols.forEach(pr => {
      console.log(`  - Protocol: ${pr.numeroSecuencial} (External: ${pr.codigoExterno})`);
    });
  });
}

testApiQueryEx().finally(() => prisma.$disconnect());
