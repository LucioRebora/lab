import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const users = await (prisma as any).manlabUser.findMany({
            where: { active: true },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("Error fetching Manlab users:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const { nombre, manlabId } = data;

        if (!nombre || !manlabId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const user = await (prisma as any).manlabUser.create({
            data: {
                nombre,
                manlabId,
                active: true
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        console.error("Error creating Manlab user:", error);
        return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }
}
