
import { prisma } from "./src/lib/prisma";

async function migrate() {
  console.log("Migrating formats...");
  
  const resText = await (prisma as any).subDetermination.updateMany({
    where: { formato: 'TXT' },
    data: { formato: 'TEXT' }
  });
  console.log(`Updated ${resText.count} TXT to TEXT`);

  const resInt = await (prisma as any).subDetermination.updateMany({
    where: { formato: 'D0' },
    data: { formato: 'INTEGER' }
  });
  console.log(`Updated ${resInt.count} D0 to INTEGER`);

  const resD1 = await (prisma as any).subDetermination.updateMany({
    where: { formato: 'D1' },
    data: { formato: 'DECIMAL_1' }
  });
  console.log(`Updated ${resD1.count} D1 to DECIMAL_1`);

  const resD2 = await (prisma as any).subDetermination.updateMany({
    where: { formato: 'D2' },
    data: { formato: 'DECIMAL_2' }
  });
  console.log(`Updated ${resD2.count} D2 to DECIMAL_2`);
}

migrate();
