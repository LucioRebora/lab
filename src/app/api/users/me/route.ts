import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return new NextResponse("Unauthorized", { status: 401 });

        const user = await prisma.user.findUnique({
            where: { id: (session.user as any).id },
            select: { image: true } as any
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("GET /api/users/me Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
