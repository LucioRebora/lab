const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const testUser = await prisma.notifiedUser.create({
      data: {
        email: 'test_clave@example.com',
        apellido: 'Test',
        nombre: 'Clave',
        clave: '123456789012345678901234567890',
        laboratoryId: 'cmm58sbbt0000xw4pp6ynzgyi'
      }
    });
    console.log('Success: User created with clave:', testUser.id);
    await prisma.notifiedUser.delete({ where: { id: testUser.id } });
  } catch (error) {
    console.error('Error testing clave:', error.message);
  }
}

main().finally(() => prisma.$disconnect());
