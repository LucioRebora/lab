const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DATA = `CÓDIGO	DETERMINACIONES	Abreviatura	Urgencia	Ref.	U.B.	Anexo
660001	ACTO BIOQUÍMICO	AB		N	3	P.M.O
660002	ACETONURIA.				1	P.M.O
660004	ACIDIMETRIA GASTRICA, CURVA DE				3	P.M.O
660005	ÁCIDO BASE, Estado Ácido Base (EAB).	EAB	U	N	15	P.M.O
660006	ACTH - HORMONA ADRENOCORTICOTROFINA.	ACTH			12	P.M.O
660007	ADDIS, RECUENTO DE				2	P.M.O
660009	ADRENALINA, plasmática (CATECOLAMINA plasmática)				25	P.M.O
660010	ADRENALINA, urinaria (CATECOLAMINA urinaria)				25	P.M.O
660014	AGLUTININAS del SISTEMAS ABO.				3	P.M.O
660015	ALBUMINA - sérica	Alb	U		1,5	P.M.O
660016	ALCOHOL DEHIDROGENASA, ADH.	ADH			10	P.M.O
660017	ALCOHOL ETÍLICO - sangre (ALCOHOLEMIA)				10	P.M.O
660018	ALDOLASA (Ald)	Ald			6	P.M.O
660019	ALDOSTERONA.				15	P.M.O
660020	ALFA FETO PROTEINA (AFP)	AFP			10	P.M.O
660022	AMILASA - sérica.		U		4	P.M.O
660023	AMILASA - urinaria.		U		4	P.M.O
660025	AMINOÁCIDOS FRACCIONADOS (Cromatografía - por fracción) - cualitativo				12,5	P.M.O
660027	AMINOACIDURIA FRACCIONADA (Cromatografía - por fracción) - cualitativo				12,5	P.M.O
660028	AMNIOTICO, LÍQUIDO CELULAS NARANJAS.				1	P.M.O
660029	AMNIOTICO, LÍQUIDO (Espectrofotometría - Test de Lisley)				5	P.M.O
660030	AMNIOTICO, LÍQUIDO LECITINA - ESFINGOMIELINA.				5	P.M.O
660031	AMONEMIA.				20	P.M.O
660033	ANGIOTENSINA I				30	P.M.O
660035	ANTIBIOGRAMA	ATBG - ATB			6	P.M.O
660036	ANTIBIOGRAMA BACILO DE KOCH (7) siete antibióticos.			N	60	P.M.O
660040	ANTICUERPOS ANTIGLOMERULAR, (IFI)				6	P.M.O
660041	ANTICUERPOS ANTIMEMBRANA BASAL, (IFI)	AMB			6	P.M.O
660042	ANTICUERPO ANMUSCULO LISO (ASMA), (IFI)	ASMA - AML			7	P.M.O
660046	ANTICUERPOS ANTITIROGLOBULINA (ATG)	ATG			10	P.M.O
660049	ANTIDESIXIRRIBONUCLEASA - ADNEASA – Anti-DNA.	DNA			9	P.M.O
660051	ANTIESTREPTOLISINAS "O" (ASO / ASTO / AELO), cuantitativa	ASO / ASTO / AELO			6	P.M.O
660053	ANTIFÚNGICOS - PRUEBA DE SENSIBILIDAD				15	P.M.O
660055	ANTIMITOCONDRIALES, ANTICUERPOS (AMA)	AMA			7	P.M.O
660056	ANTINUCLEARES ANTICUERPOS (FAN / ANA / AAN)	FAN / ANA / AAN			7	P.M.O
660057	ANTITRIPSINA, Alfa 1 (α1 AT) - Líq. Pleural o Mat. Fecal o Sérica - C/U - (por I.D.-Cuantitativa)	α1 AT			10	P.M.O
660058	ANTITROMBINA III - con calibración de tres (3) puntos.				15	P.M.O
660059	ARSENICO (As) - sérico o urinario.	As			20	P.M.O
660060	ASCORBICO, ÁCIDO - sérico				30	P.M.O
660063	ANTICUERPOS Anti- HIV (ELISA)	HIV			11	P.M.O
660101	BACILOSCOPIA DIRECTA - ZIEHL NEELSEN (por muestra)		U		4	P.M.O
660102	BACILOSCOPIA, DIRECTA y CULTIVO (por muestra)			N	10	P.M.O
660103	BACILOSCOPIA, (IFI - por muestra)				10	P.M.O
660104	BACTERIOLOGIA, DIRECTA (Coloración de Gram)		U		2	P.M.O
660105	BACTERIOLOGICO, DIRECTO-CULTIVO e IDENTIFICACIÓN del GÉRMEN			N	7	P.M.O
660107	BARBITÚRICOS - urinarios.				17,5	P.M.O
660108	BENCE-JONES, PROTEINAS de (HPLC / IMF)	BJ		N	30	P.M.O`;

async function main() {
    // Delete mistakenly seeded global studies from Study table
    await prisma.study.deleteMany({ where: { laboratoryId: null } }).catch(() => { });

    const lines = DATA.split("\n");
    lines.shift(); // header

    for (const line of lines) {
        if (!line.trim()) continue;
        const [codigo, det, abrev, urg, ref, ub, anexo] = line.split("\t");

        let ubParsed = parseFloat(ub?.replace(",", "."));
        if (isNaN(ubParsed)) ubParsed = 0;

        const isUrg = urg?.trim().toUpperCase() === "U";

        const cod = parseInt(codigo, 10);
        await prisma.centralNBU.upsert({
            where: { codigo: cod },
            update: {
                determinacion: det?.trim(),
                abreviatura: abrev?.trim() || null,
                urgencia: isUrg,
                ref: ref?.trim() || null,
                ub: ubParsed,
                anexo: anexo?.trim() || null,
            },
            create: {
                codigo: cod,
                determinacion: det?.trim() || "Sin Nombre",
                abreviatura: abrev?.trim() || null,
                urgencia: isUrg,
                ref: ref?.trim() || null,
                ub: ubParsed,
                anexo: anexo?.trim() || null,
            }
        });
    }

    console.log("CentralNBU cargado con éxito!");
}

main().then(() => prisma.$disconnect()).catch(console.error);
