import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
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

        const doctor = await prisma.doctor.update({
            where: { id: params.id },
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
            }
        });

        return NextResponse.json(doctor);
    } catch (error) {
        console.error("Error updating doctor:", error);
        return NextResponse.json({ error: "Failed to update doctor" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const params = await props.params;
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

        await prisma.doctor.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: "Doctor deleted successfully" });
    } catch (error) {
        console.error("Error deleting doctor:", error);
        return NextResponse.json({ error: "Failed to delete doctor" }, { status: 500 });
    }
}
