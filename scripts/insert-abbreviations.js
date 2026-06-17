const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const laboratoryId = "cmm58sbbt0000xw4pp6ynzgyi";

const rawData = `Abundante cantidad	Ac
Amarillo	AM
Amarillo claro	acl
Amarillo oscuro	ao
Ambar	amb
Amicacina: RESISTENTE	AMKR
Amicacina: SENSIBLE	AMKS
Ampicilina: RESISTENTE	AMPR
Ampicilina: SENSIBLE	AMPS
Ampicilina-Sulbactam: RESISTENTE	AMSR
Ampicilina-Sulbactam: SENSIBLE	AMSS
Cefalotina: RESISTENTE	CEFR
Cefalotina: SENSIBLE	CEFS
Cefazolina: RESISTENTE	CZR
Cefazolina: SENSIBLE	CZS
Cefepime: RESISTENTE	FEPR
Cefepime: SENSIBLE	FEPS
Cefotaxima: RESISTENTE	CTXR
Cefotaxima: SENSIBLE	CTXS
Ceftazidima: RESISTENTE	CAZR
Ceftazidima: SENSIBLE	CAZS
Ceftriaxona: RESISTENTE	CROR
Ceftriaxona: SENSIBLE	CROS
Cepa prod de betalactamasa de espectro extendido	Blee
Ciprofloxacina: RESISTENTE	CIPR
Ciprofloxacina: SENSIBLE	CIPS
Clindamicina: RESISTENTE	CLIR
Clindamicina: SENSIBLE	CLIS
Colistina: RESISTENTE	COLR
Colistina: SENSIBLE	COLS
Contiene (+)	1+
Contiene (++)	2+
Contiene (+++)	3+
Contiene (++++)	4+
Contiene trazas	tr
Eritromicina: RESISTENTE	ERIR
Eritromicina: SENSIBLE	ERIS
Ertapenem: RESISTENTE	ERTR
Ertapenem: SENSIBLE	ERTS
Escasa cantidad	ec
Escherichia coli	Esche
Flora orofaríngea habitual	FOH
Fosfomicina: RESISTENTE	FOSR
Fosfomicina: SENSIBLE	FOSS
Gardnerella vaginalis	gv
Gentamicina: RESISTENTE	GENR
Gentamicina: SENSIBLE	GENS
Imipenem: RESISTENTE	IMIR
Imipenem: SENSIBLE	IMIS
Klebsiella pneumoniae	kp
Ligeramente turbio	lt
Límpido	L
Los Staphylococcus aureus	meticilino
Meropenem: RESISTENTE	MERR
Meropenem: SENSIBLE	MERS
Microbiota habitual de vagina	MHV
Minociclina: RESISTENTE	MINR
Minociclina: SENSIBLE	MINS
Muy abundante cantidad	mac
NEGATIVO	N
Negativo	ne
Nitrofurantoina: RESISTENTE	NFR
Nitrofurantoina: SENSIBLE	NFS
No contiene	NC
No dosable	ND
No se aisla flora bacteriana patogena	nsafbp
No se aislan bacterias	nsab
No se observan	NS
No se observan bacilos acido-alcohol resistentes	nsobaar
No se observan bacterias	Nsob
No se observan elementos fúngicos	nsoef
No se observan elementos parasitarios	nsoep
No se observan huevos de Enterobius vermicularis	nsohev
No se obtiene desarrollo	nsod
Normal	NL
Piperacilina-Tazobactam: RESISTENTE	PTZR
Piperacilina-Tazobactam: SENSIBLE	PTZS
Positivo	po
POSITIVO	P
Regular cantidad	rc
RESISTENTE	R
Rifampicina: RESISTENTE	RIFR
Rifampicina: SENSIBLE	RIFS
Se aisla flora habitual de fauces	safhf
Se aisla flora habitual de vagina	safhv
Se observan	SO
Se observan huevos de Enterobius vermicularis	sohev
SENSIBLE	S
Serie roja normal.	srn
Staphylococcus aureus meticilino resistente	SAMR
SUERO NO REACTIVO	NR
SUERO REACTIVO	SR
Tigeciclina: RESISTENTE	TGCR
Tigeciclina: SENSIBLE	TGCS
Trimetoprima-Sulfametoxazol: RESISTENTE	TMSR
Trimetoprima-Sulfametoxazol: SENSIBLE	TMSS
Turbio	t
Vancomicina: RESISTENTE	VANR
Vancomicina: SENSIBLE	VANS
Vestigios	ve`;

async function main() {
    const lines = rawData.split('\n').filter(l => l.trim().length > 0);
    console.log('Total abbreviations to evaluate:', lines.length);

    let insertedCount = 0;
    for (const line of lines) {
        const parts = line.split('\t');
        const resultado = parts[0]?.trim();
        const abreviatura = parts[1]?.trim() || '';

        if (!resultado) continue;

        try {
            const existing = await prisma.abbreviation.findFirst({
                where: {
                    resultado: resultado,
                    laboratoryId: laboratoryId
                }
            });

            if (!existing) {
                await prisma.abbreviation.create({
                    data: {
                        resultado,
                        abreviatura,
                        laboratoryId
                    }
                });
                insertedCount++;
            }
        } catch (e) {
            console.error('Error inserting', line, e.message);
        }
    }

    console.log('Successfully inserted ' + insertedCount + ' new abbreviations.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
