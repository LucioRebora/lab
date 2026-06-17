const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const laboratoryId = "cmm58sbbt0000xw4pp6ynzgyi";

const rawData = `17-OH-Pg-
481
5´-N
546
ABO
Ac antiendisio (A)
Ac antiendomisio (A)
Ac antiendomisio (G)
Ac Antifosfol IgG
Ac Antifosfol IgM
Ac antigliadina IgA
Ac antigliadina IgG
Ac celulas parietal
Ac centrómero
Ac DNA
Ac GM
Ac HB core Ig G
Ac HBe IgG
Ac hidatidosis G
Ac hidatidosis M
Ac IgA anti Pilori
Ac IgG Anti pilori
Ac IgM anti Pilori
AC IRREGULARES
ac membrana basal
Ac ML
Ac Neospora
Ac Tiroglobulina s
Ac. Anti Insulina
Ac. ENA
Ac. FMT
Ac. GAD
ACETIL COLINA
ACETONA
AcFMT
Acido homovanilico
Acidos biliares
acidos grasos largos
AcLKM
AcMIT-M2
AcRAC
ACTH
AcTPO
ADA
Addis
Addis24
Adeno
ADH
ADN
AFETAMINAS
Agua
Albúmina
Alcoholemia
Alcoholuria
Aldolasa
Aldos/Renina
Aldosterona
ALFA 1 ANTITRIPSINA
Alfa feto proteina
Alimento
Allcoholuria
ALP
Alp Acida total
ALPosea
ALS
Aluminio
AMA
Amilasa canino
Amilasemia
Amilasemia-p
Amonio
AMP
ANCA
Androstenediona
Anfetaminas
ANTI CORE HEP B
Anti Insulina Ac
Anti JO-1
Anti La (SSB)
Anti RNP
Anti Ro/Ssa
Anti scl-70
Anti Sm
ANTI-CCP
ANTI-CCP PINO
Anticoagulant Lúpico
antifactorintrinseco
antifungi
Antigliadina Pino
antimulleriana
ANTITRIPSINA CLEAREN
Antitrombina 3
APCR
Apo A
Apo B
arco 5
Arsenico orina
Artritest
Artritest cuan
Artritest manlab
ASCA
ASCITICO
asla
ASTO cuanti
asto cuanti manlab
ATB
ATB2019
ATBADULTO
ATBCOPRO
ATBENTERO
atbintermedio
ATBINTERNADO
ATBPED-EMB
ATBPSEUDO
AVIDEZ
AVM
Baciloscopía
BACOVA
Bact
Bartonella igg
Bartonella igm
BCR-ABL
BENCE JONES
Benzodiacepinas
beta 2 gli IgG
beta 2 glic IgM
beta 2 microglobul
Beta cross laps
beta libre
Beta2microglob (o)
Beta2microglob (s)
Betahemol prena
Bili
bioquimica seminal
Biotinidasa en suero
BNP
BODETELLA IGG
BORDETELLA IGM
Brca1/Brca2
Bromuro
BRR T Y D
Brucelosis IgG
Brucelosis IgM
BTA
C1Q
C1Q INHIB
C3
C4
CA 125
CA 15/3
CA 19.9
CA 21-1
CA 72/4
cadenas livianas
Cadmio en sangre
Calcemia
Calcemia caninos
Calcio iónico
calcitonina
Calciuria
Calciuria espontanea
CALCULO URINARIO
Cálculos
calprotectina
CAMPO OSCURO
Carbamezepina
Carboxihemoglobina
cardioli IgG
cardiolip IgM
cardiolip totales
Carga viral hiv
CARIOTIPO
Carnitina TyL S
catecolaminas plasma
Catecolaminas Urinar
Cau/Cru
CCB A
CCB B
CD 19
CEA
Cefalorraquideo
Células LE
Ceruloplasmina
Cetosteroides 17
CH50
Chagas Elisa
Chagas hai
Chagas IFI
CHE
CHIKUN IGG
CHIKUN IGM
CHLAMY NE IGG
CHLAMY NE IGM
CHLAMYDIA
Chlamydia PCR
Cistatina
Cistina en orina
Citomegalo IgG
Citomegalo IgM
Citraturia
CK-MB
CLANTITRIP
Cleareance de sodio
Clearenance de crea
cleaurea
CLONIDINA
Cloremia
CLOSTRIDIUM
Clostridium MANLAB
CLU 1 HORA
Coagulograma
coagulograma > 60
Coagulograma canino
Cobalto orina
Cobre s
Cobre u
cocaina
COCLEARES
Colest
Colesterol caninos
colesterol no-hdl
Colinesterasa eritro
Colinesterasa Vet
Compatibilidad
CONEXINA
Control neonatal
Control neonatal 2
Control neonatal 2-
Control neonatal 5
Control neonatal 6-
coombs dir
COOMBS DIR MANLAB
coombs ind
Coprocultivo
CORE AC IGM
Cort vesp
CORT/CREA
Cortisol /crea can
Cortisol plasm
Cortisol post estim
Cortisol salival
Cortisol urinario
Covid 19 antigeno
Covid 19 Real time
COVID AC TO. Spike
COVID HOSPI PS
COVID IgG Nucl
Covid IgG spike
COVID IGM Spike
CPK
CPK Caballo
CPK Veter
CREA
Crea caba
crea caninos
crea felinos
crea orina 24
Creati Orina aislada
Creatininemia Vet
Creatininuria mg/dl
Creatininuria mg/l
Crioaglut
crioglobulinas
CRIPTOCO ANTIGENO
CROMO
Cromo en orina
CT/HDL/LDL
CT/HDL/LDL/VLDL
Cultivo
CULTIVO BAAR
cultivo-Hem
CURVA F IX
CURVA F VIII
CVM (Ig G)
CVM (IgM)
D ALA ORINA
deaminado igA
deaminado IgG
Delta 4 Andr
Delta 4 Andr-q-
DELTA ALA
DENGUE G
DENGUE M
Dengue Manlab
dengue NS1 (manlab)
Dengue PCR INDABI
DENGUE RAPIDO
Deoxipiridolina
Derivacion genia
Derivacion HELIOS
derivacion Rapela
deshuso 100
deshuso 122
deshuso 20
deshuso 30
Desudo 1001
Desuhos 40
desuso
desuso 1
desuso 10
Desuso 1000
Desuso 1002
desuso 11
desuso 2
desuso 3
desuso 4
desuso 40
desuso 6
desuso 7
desuso Tn I cual
Desuso tropo US
DESUSO20
DESUSO21
DESUSO22
desuso24
DFH
DHEA - No sulfato
DHEA-S
DIGO
dimero d MANLAB
DIMERO D-LB
directo
DNA HBV
DNA NATIVO PINO
Domicilio
Dopamina plas
DOPAMINA URINARIA
DPN Test
Drogas Psicofisico
E2
E2 RAPIDO
EAB - LB
EAB  OPTI
ECA
ELASTASA
Electroforesis-Hb
Endom A
Endom G
endomisio Pino
Enolasa
Eosinófilos en secre
EPO
Epstein EA-IgM
epstein EBNA IgG
epstein EBNA-IgM
Epstein VCA IgG
Epstein VCA IgM
Eritro
Espermocultivo
Espermograma
ESPU
Esputo
estafilo
ESTEATOCRITO
Estriol libre
Estrona
ET
Examen funcional MF
Examen sinovial
Exudado de lagrimal
Exudado oido
Exudado uretral
Factor IX
factor V
FACTOR V DE COAGULAC
Factor V Leiden
Factor VII
FACTOR VIII
Factor X
Factor XI
Factor XII
FAN
FAN PINO
FAP
FAP uv
FAT
Fenil Gliox y Ac Man
Fenil Mercaptu
Fenitoina
Fenobarbital
Fenol
Ferit-SatuT
Ferremia
Ferritina
FIBRINOGENO
Fibrosis Quistica 70
Flujo
Fluor
Folico
Fólico
Formico en orina
Fosfatemia
Fosfatemia caninos
Fosfaturia
fosfaturia al azar
fresco
frotis
Fructosamina
FSH
FTAbs
GAD
Gamma GT
Gamma GT Caballo
Gamma GT Veter
GASES
GLAE/SHBG
Gliadina A
Gliadina G
Glico
Glidina Pino
Glioxilico y Mande
GLU
Glu 6 P DH
glu16
Glucemia caballo
Glucemia post prand
Glucosa caninos
Glucuronido
Glucusuria
GLUT 1
GLUTATION PX
GOT o AST
GPT o ALT
Gravindex
H1N1
HANTA
Haptoglobina
HAV
HAV Ig G
HAV IgM
Hb
Hb glic MANLAB
Hb glico LB
HBe Ag
HBs Ag LB
HBs Ag manlab
HBsAC
HCG - MT-
HCG cualitativa
HCG cualitativa (u)
HCG cuantitativa
HCV-RNA CUALI
HDL
HDL col
--HE4
HEMO
Hemo psico
Hemo vete
Hemoaglut
hemocultivo
hemocultivo 1er repi
hemohongo
hemolisis
HEMOP
Hep B anti E
HEPATITIS B CV
HEPATITIS C CV
Hepatitis c manlab
Hepatitis E IgG
HEPATO
Hepato Caballo
hepato caninos
hepato felinos
Hepatograma completo
Hepatograma Veter
HERPES 6 IGG
HERPES I IGG
HERPES IGM
HERPES II IGG
HERPES VI IGM
Hexanodiona 2,5
HIDATIDOSIS (IFI)
HIDATIDOSIS ELISA
Hidatidosis HAI
HIDROXI INDOL
Hidroxipirenos
Hidroxiprolinuria
Hipurico
HISOPA
Hisopado faringeo
hisopado nasal
Hisopado rectal
HISOPV
Histaminemia
HIV - P24
HIV LB
HIV MANLAB
HIV WB
HLA B27
HLA B51
HOMA
Homocisteína
HTLV
Hto.
Huddleson
IFGe
IFG-I
ifi  mico pneu m
ifi chlamy pneu g
ifi chlamy pneum m
ifi chlamy tracho g
ifi chlamy tracho m
IfI mico pneu g
Ig A
Ig As
Ig D
Ig E
IG E ALTERNARIA
IG E ASPERGILLUS NI
IG E AVENA
IG E BLOMIA
IG E CASEINA
IG E CENTENO
IG E CHOCOLATE
IG E CLARA DE HUEVO
IG E CUCARACHA
IG E FARINAE
IG E FRESNO
IG E FRUTILLA
IG E GATO
IG E GLUTEN
IG E GRAMINEAS
IG E HIERBAS
IG E KIWI
IG E LACTOALBUMINA
IG E LACTOGLOBULINA
IG E LECHE
IG E MAIZ
Ig E MANÍ
IG E NARANJA
IG E NUEZ
IG E PERRO
IG E PESCADO
IG E PESCADOS
IG E PLATANO
IG E POLVO
IG E PTERONISSIMUS
IG E SOJA
IG E TOMATE
IG E TRIGO
IG E YEMA DE HUEVO
Ig E-q-
Ig G
Ig M
IGE ALMENDRAS
IGE AMBROSIA
IgE Amoxicilina
IgE Ampi
IgE Arboles
IGE CYNODON
IgE Gramin
IgE Hongos
IgE Peni V
IgE Penicilina
IgE PeniG
IGFBP3
IGF-I
IL 6
Indice de homa
INHIBINA A
INHIBINA B
Inmunoelectroforesis
Inmunofenotipo en le
INMUNOFIJACION
INMUNOFIJACION EN OR
Insulinemia
Insulinemia pprandia
Insulinemia sobrec
Ionograma
Ionograma orina aisl
Ionograma urinario
ISLOTES PANC
ISOENZ FAL
JAK-2
KAPPA
kappa libre suero
KPTT
kruger
LACTATO
LAMBDA
lambda libre suero
Lamotrigina
LAR cuantitativo
lavado aguja
LCR
LDH
LDL
LEPTO IGG
LEPTO IGM
Leptospirosis
Leptospirosis rap
leucoMF
levetira
LH
Linfocitos CD3
Linfocitos Cd4
linfocitos cd8
Lipasa
Lipemia
Lipidograma
Lipo A
liquido de puncion
LIQUIDO PLEURAL
LISIS GLOBULINAS
Litemia
LUPICO
MACROPROLACTINA
Magnesemia
Magnesiuria
Manganeso
marihua
MARTEST
MAT
material veterinaria
MDMA
MDRD-4
MERCURIO ORINA
MERCURIO SANGRE
Metahemoglobina
Metanefrinas urin
Metanol
Metil etil cetona
Metil Hipurico
MF direc-copro
MF directo
MF seriado-escobilla
Micobacterias atipic
Micológico
MICOPLA NE IGG
MICOPLA NE IGM
MICOPLASMA IGG
MICOPLASMA IGM
Microalbuminuria
Mioglobina Orina
Mioglobina serica
Mononucleosis
MPO
MTHFR
Muconico TT
Mucoproteinas
MYCOBACTERIUM GEN
MYCOPLASMA
Neisse
Neospora Raeplla
Neumococo
Niquel en orina
Niquel Sangre
no
NO USAR
Oorganoclorados
Orina
orina Psicofisico
Orto Cresol
OSM PLASMA
OSM URI
Osteocalcina
Oxacarbamazepina
Oxaluria
OXCARBA
P 50
Paciente
PAD
PAI
PAI-1
PAP
PAPP-A
Paracci
PAROTIDITIS IGG
PAROTIDITIS IGM
Parvovirus IgG
Parvovirus IgM
PBI
Pb-s
PCHE
PCR
PCR CUALI
pcr MANLAB
PCRcruces
Pcreatininemia
Pdf
Peptido C
PEPTIDO C uri
Perfil lipidico
Perfil lipidico medi
Pesquisa manlab
Pg
Pg RAPIDA
PGOT
PGPT
Phemograma
Plaquetas
Plasma Rico
Plata en suero
PLOMO
Porfobili-O
PPD
PR3
Praccocc
PRC
PREFILL
Prl
proBNP
PROCA - LB
PROCA INDABI
PROT C
PROTEINA S LIBRE
Proteinas frac
Proteinas frac Caba
Proteinas frac vete
Proteinemia
Proteinemia caninos
Proteinograma Electr
proteinograma lcr
Proteinograma orina
Proteinuria
Proteinuria mg/dl
proteinuria/ gr crea
proto eritrocitaria
Protoncogen RET
Protoporfirinas
protrombina20210
Prueba de cc orina
PSA Libre
PSA Total
PSA total y libre
PTH
PTOG
RAC
RAST ACAROS
RAST EPITELIO
RAST HONGOS
RAST MOHOS
RAST POLEN
REC DE LEV
RECEP
Relación Cau/Cru
RENINA
Renina actividad
RESIST PROT C
Reticulocitos
Retraccion coagulo
RETRO
Rh
rin
RISTOCETINA
RNP
Rosa bengala
Rosse Ragan
Rota
Rto Blancos
Rubeola IgG
Rubeola IgM
Sarampión IgG
Sat transf
SCL 70
Selenio
Seriado
seriado positivo
serotonina
Sirolimus
SOD
SOMFEsp
STH con ejercicio
STH o HGH
STN - plasmática
STN- plaquetaria
Streptozyme
Strut
SUBCLASES IgG
Sudan
T3
T3 L
T4
T4 Libre
T4 Libre canina
TCA ORINA
Test de Graham negat
Test de Graham posit
TEST GENETECIO CELIA
Test primer trimestr
Test rápido fauces
TGC
TIBC-ST
Tiempo de coagulació
Tiempo de sangría
Tiocianato orina
TIPIF LEUC
tiroglobulina
TIROSINA FOSFA
Tirosina fosfatasa
TLI
Tobiodis
ToL
Topiramato
ToS
TOXO GENOMA
Toxo ig G Rapella
Toxo Ig M Rapella
Toxocara
Toxopla IgG Q
Toxopla IgM Q
Toxoplasmosis
Toxoplasmosis avidez
Toxoplasmosis IFI
Toxoplasmosis IgM
Tp
TP corregido
TPO
TPPA
TRAB
Transferrina
Transferrina Manlab
Transfe-ST
transg tisul IGG
Transgluta A
Transgluta G
transgluta Pino
traslocacion 9-22
TREPONEMA
Trichi igG
Trichi igM
Tricloroacetico en O
Trigliceridemia
Trigliceridemia cani
TRIPLE TEST
Triptasa
Tropo I - LB
Tropo T Roche
TSH
TSH canina
URE
Ure urinaria
urea caninos
urea felinos
UREAPLASMA
UREAURINAZAR
Uremia caballo
URG
Uricemia
Uricosuria
uricosuria espont
Urocitograma
Uroporfirinas
UROS
Valproato
VANCO
Varicela IgG
Varicela IgM
VDRL
Vigabatrin
Vitamina A
VITAMINA B1
Vitamina B12
vitamina b6
Vitamina C
Vitamina D3
VITAMINA E
VITD total
VLDL
VON WILLEBRAND
VPA
Widal
WIonograma urinario
WPSA Total-r-
wT3-r-
wT4 Libre-r-
wT4-r-
wTSH-r-
wwwAnticoag Lúpico
xHemocont
xHemograma
xT3
xT4
xT4 Libre
xTSH
XXXXXXXXXXX
zermatozoides orin
ZHIV-P24
ZIKA IGG
ZIKA IGM
ZINC
Zn
ZT3.
ZT4.
ZTSH.`;

async function main() {
    const lines = rawData.split('\n').filter(l => l.trim().length > 0);
    console.log('Total determinations to evaluate:', lines.length);

    let insertedCount = 0;
    for (const line of lines) {
        const nombre = line.trim();

        if (!nombre) continue;

        try {
            const existing = await prisma.determination.findFirst({
                where: {
                    nombre: nombre,
                    laboratoryId: laboratoryId
                }
            });

            if (!existing) {
                await prisma.determination.create({
                    data: {
                        nombre,
                        abreviatura: '',
                        mensajeIngreso: '',
                        comentarioFijo: '',
                        aspecto: '',
                        condicionesMuestra: '',
                        imprimirWorksheet: true,
                        resumirWorksheet: false,
                        alturaWorksheet: 0,
                        laboratoryId
                    }
                });
                insertedCount++;
            }
        } catch (e) {
            console.error('Error inserting', line, e.message);
        }
    }

    console.log('Successfully inserted ' + insertedCount + ' new determinations.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
