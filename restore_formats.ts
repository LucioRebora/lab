
import { prisma } from "./src/lib/prisma";
import fs from "fs";
import path from "path";

async function restore() {
  const csvPath = path.join(process.cwd(), "tmps/subdeterminations/SubDeterminaciones.csv");
  const content = fs.readFileSync(csvPath, "utf-8");
  const lines = content.split("\n");
  
  // Skip header
  const data = lines.slice(1).filter(l => l.trim() !== "");
  
  const mapping: any = {
    "TXT": "TEXT",
    "D0": "INTEGER",
    "D1": "DECIMAL_1",
    "D2": "DECIMAL_2"
  };

  console.log(`Starting restoration of ${data.length} items...`);
  
  let count = 0;
  for (const line of data) {
    const parts = line.split(",");
    if (parts.length < 4) continue;
    
    // IDSubDeterminacion is the external code (probably maps to codigoExterno in our DB)
    const idSub = parts[0]; 
    const formatoRaw = parts[3];
    const newFormato = mapping[formatoRaw];

    if (newFormato) {
      await (prisma as any).subDetermination.updateMany({
        where: { codigoExterno: idSub },
        data: { formato: newFormato }
      });
      count++;
      if (count % 100 === 0) console.log(`Processed ${count}...`);
    }
  }
  
  console.log(`Restoration complete. Updated ${count} records.`);
}

restore();
