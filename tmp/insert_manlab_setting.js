const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const labId = "cmm58sbbt0000xw4pp6ynzgyi";
  const key = "manlab";
  const value = JSON.stringify({
    "5569": "MANLAB Emiliano",
    "5570": "MANLAB Renata"
  }, null, 2);

  const setting = await prisma.setting.upsert({
    where: {
      // In prisma/schema.prisma, Setting doesn't have a unique constraint on (key, laboratoryId)
      // I'll search for it first or just create a new one if it doesn't exist.
      id: "setting_manlab_" + labId
    },
    update: {
      value: value,
      updatedAt: new Date()
    },
    create: {
      id: "setting_manlab_" + labId,
      key: key,
      value: value,
      laboratoryId: labId,
      description: "Códigos de cliente Manlab"
    }
  });

  console.log("Setting upserted:", setting);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
