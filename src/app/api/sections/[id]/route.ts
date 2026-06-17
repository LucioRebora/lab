import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await props.params;
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

        const section = await prisma.section.findUnique({
            where: { id },
            include: {
                tag: true,
                worksheet: true
            }
        });

        if (!section) {
            return NextResponse.json({ error: "Section not found" }, { status: 404 });
        }

        return NextResponse.json(section);
    } catch (error) {
        console.error("Error fetching section:", error);
        return NextResponse.json({ error: "Failed to fetch section" }, { status: 500 });
    }
}


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

        const item = await prisma.section.update({
            where: { id: params.id },
            data: {
                nombre: data.nombre,
                hojaTrabajo: data.hojaTrabajo || null,
                etiqueta: data.etiqueta || null,
            }
        });

        return NextResponse.json(item);
    } catch (error) {
        console.error("Error updating section:", error);
        return NextResponse.json({ error: "Failed to update section" }, { status: 500 });
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

        await prisma.section.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ message: "Section deleted successfully" });
    } catch (error) {
        console.error("Error deleting section:", error);
        return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
    }
}
