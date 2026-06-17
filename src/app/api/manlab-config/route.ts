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

        const config = await (prisma as any).manlabConfig.findUnique({
            where: { id: "singleton" }
        });

        if (!config) {
            return NextResponse.json({
                ftpUrl: "",
                ftpUser: "",
                ftpPass: ""
            });
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error("Error fetching Manlab config:", error);
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

        const config = await (prisma as any).manlabConfig.upsert({
            where: { id: "singleton" },
            update: {
                ftpUrl: data.ftpUrl,
                ftpUser: data.ftpUser,
                ftpPass: data.ftpPass,
            },
            create: {
                id: "singleton",
                ftpUrl: data.ftpUrl,
                ftpUser: data.ftpUser,
                ftpPass: data.ftpPass,
            }
        });

        return NextResponse.json(config);
    } catch (error) {
        console.error("Error updating Manlab config:", error);
        return NextResponse.json({ error: "Failed to update config" }, { status: 500 });
    }
}
