import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("admin1234", 12);

    const admin = await prisma.user.upsert({
        where: { email: "admin@bioitia.com" },
        update: { password: hashedPassword, role: "ADMIN" },
        create: {
            email: "admin@bioitia.com",
            name: "Administrador",
            password: hashedPassword,
            role: "ADMIN",
        },
    });

    console.log("✅ Usuario admin creado:", admin.email);
}

main()
    .then(async () => { await prisma.$disconnect(); })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
