const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sr = await prisma.subResult.findUnique({
        where: { codigoExterno: '18279' },
        include: { result: true }
    });

    if (sr) {
        console.log('SUBRESULTADO ENCONTRADO:');
        console.log('- ID Externo:', sr.codigoExterno);
        console.log('- Valor:', sr.valor);
        console.log('- Comentario:', sr.comentario);
        console.log('- Result ID Externo:', sr.result ? sr.result.codigoExterno : 'N/A');
    } else {
        console.log('No se encontró el subresultado 18279');
    }

    await prisma.$disconnect();
}

main();
