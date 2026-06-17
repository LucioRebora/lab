import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            include: { laboratory: true }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const doctors = await prisma.doctor.findMany({
            where: user.role === "ADMIN" ? {} : { laboratoryId: user.laboratoryId },
            orderBy: { apellido: 'asc' },
        });

        return NextResponse.json(doctors);
    } catch (error) {
        console.error("Error obtaining doctors:", error);
        return NextResponse.json({ error: "Failed to fetch doctors" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || (!user.laboratoryId && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "No laboratory assigned" }, { status: 403 });
        }

        const data = await request.json();

        const doctor = await prisma.doctor.create({
            data: {
                apellido: data.apellido,
                nombre: data.nombre,
                tratamiento: data.tratamiento,
                matriculaProvincial: data.matriculaProvincial,
                direccion: data.direccion,
                ciudad: data.ciudad,
                provincia: data.provincia,
                codigoPostal: data.codigoPostal,
                telefono: data.telefono,
                celular: data.celular,
                email: data.email,
                notas: data.notas,
                laboratoryId: user.laboratoryId,
            }
        });

        return NextResponse.json(doctor);
    } catch (error) {
        console.error("Error creating doctor:", error);
        return NextResponse.json({ error: "Failed to create doctor" }, { status: 500 });
    }
}
