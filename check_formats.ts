
import { prisma } from "./src/lib/prisma";

async function check() {
  const subDets = await (prisma as any).subDetermination.findMany({
    select: { formato: true },
    take: 20
  });
  console.log(subDets);
}

check();
