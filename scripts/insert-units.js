const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const laboratoryId = "cmm58sbbt0000xw4pp6ynzgyi";

const rawData = `%
% Hb A1c
% post correción
.
/12 hs.
/24 hs.
/campo
/ml.
/mm3
µµg
µ3
µg%
µg/24 hs.
µg/dl
µg/ml.
µmol/l.
µU/dl.
µU/ml.
µUI/ml
10x-5
años
AU/ml.
Copias RNA viral
copias/ml.
dils.
DMMDN
DMMDR
DMNEX
DMNGF
Esperm.
Esperm./ml.
fl
g%
g/24 hs.
g/cm3
g/dl
g/g creat.
g/l
GB/mm3
glob. De grasa/campo
GPL
GR/mm3
Hs.
KU/l
litros/24 hs.
m2
mEq/24 hs.
mEq/l
mg%
mg/100 g MF
mg/24 hs
mg/dl
mg/dl/g heces
mg/g
mg/gCr
mg/l
mg/litro
mg/mg
min.
ml
ml/24 Hs.
ml/min
ml/min/1,73m2
mm
mmHg
mMol/L
MoM
mOSm/Kg.
MPL
mU/ml
mUI/ml
ng %
ng/dl
ng/L
ng/mg crea
ng/ml
ng/ml FEU.
ng/ml/hora.
nM/L
nmol/l
nMol/mMol
nMoles/L
Nº/mm3
ODU
pg
Pg/1.000.000 pq
pg/ml
pmol/l
por campo
S/CO
seg.
U
U STZ
U.CH 50%
U.CH50
U/g Hb
U/l
U/ml
U/ml hematies.
UA
UA %
UA/ml
UCH50
UFC
UFC/ml
ug/24 Hs.
ug/dl
ug/g de creat.
ug/g de mat. Fecal
ug/g Hb.
ug/L
ug/ml.
UGPL/ml
UI
UI/l
UI/ml
umol/L
UMPL/ml
Unidad
Unidades
UR/ml
uUI/ml
x campo
x campo.`;

async function main() {
    const lines = rawData.split('\n').filter(l => l.trim().length > 0);
    console.log('Total units to evaluate:', lines.length);

    let insertedCount = 0;
    for (const line of lines) {
        const nombre = line.trim();

        if (!nombre) continue;

        try {
            const existing = await prisma.unit.findFirst({
                where: {
                    nombre: nombre,
                    laboratoryId: laboratoryId
                }
            });

            if (!existing) {
                await prisma.unit.create({
                    data: {
                        nombre,
                        laboratoryId
                    }
                });
                insertedCount++;
            }
        } catch (e) {
            console.error('Error inserting', line, e.message);
        }
    }

    console.log('Successfully inserted ' + insertedCount + ' new units.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
