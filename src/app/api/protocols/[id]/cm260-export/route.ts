import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

function calculateAge(birthDate: Date | null): string {
    if (!birthDate) return "";
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const month = today.getMonth() - birth.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age.toString();
}

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const { id: protocolId } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        // 1. Fetch Protocol with full details
        const protocol = await (prisma as any).protocol.findUnique({
            where: { id: protocolId },
            include: {
                patient: true,
                results: {
                    include: {
                        determination: {
                            include: {
                                subDeterminations: true
                            }
                        }
                    }
                }
            }
        });

        if (!protocol) return NextResponse.json({ error: "Protocol not found" }, { status: 404 });

        const laboratoryId = protocol.laboratoryId;

        // 2. Identify CM260 equipment for this lab
        const equipment = await (prisma as any).equipment.findFirst({
            where: { 
                nombre: { contains: 'CM260', mode: 'insensitive' }
            }
        });

        if (!equipment) return NextResponse.json({ error: "Equipo CM260 no encontrado" }, { status: 404 });

        // 3. Get generic config for SampleType
        const eqConfig = await (prisma as any).equipmentConfig.findUnique({
            where: {
                equipmentId_laboratoryId: {
                    equipmentId: equipment.id,
                    laboratoryId: laboratoryId
                }
            }
        });

        // Default or configured SampleType
        let sampleType = "N";
        if (eqConfig && eqConfig.config) {
            const configArray = eqConfig.config as any[];
            if (configArray.length > 0) {
                sampleType = configArray[0].SampleType || "N";
            }
        }

        // 4. Collect mapped technical codes from mapper_cm260
        // We need to look up in mapper_cm260 for all subdeterminations of the determinations in the protocol
        const subDetIds = protocol.results.flatMap((res: any) => 
            res.determination.subDeterminations.map((sd: any) => sd.id)
        );

        const mappings = await (prisma as any).mapperCM260.findMany({
            where: {
                subDeterminationId: { in: subDetIds },
                equipmentId: equipment.id,
                laboratoryId: laboratoryId
            }
        });

        // Get unique technical codes (avoid duplicates)
        const technicalCodes = Array.from(new Set(mappings.map((m: any) => m.tecnica).filter(Boolean)));

        // 5. Build the string
        const fullName = `${protocol.patient.apellido}, ${protocol.patient.nombre}`;
        const age = calculateAge(protocol.patient.fechaNacimiento);
        const sex = protocol.patient.sexo === "M" ? "M" : protocol.patient.sexo === "F" ? "F" : "M"; // Fallback to M if unknown

        // Format: ProtocolNum;SampleType;FullName;;Age;Sex;Count;Test1;Test2...
        const line = [
            protocol.numeroSecuencial,
            sampleType,
            fullName,
            "", // empty field 4
            age,
            sex,
            technicalCodes.length,
            ...technicalCodes
        ].join(";");

        return NextResponse.json({ 
            fileName: "Importar.ana",
            content: line,
            equipmentId: equipment.id
        });

    } catch (error: any) {
        console.error("Error generating CM260 export:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
