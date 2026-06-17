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

        const settings = await (prisma as any).manlabSetting.findMany();
        
        // Convert to record format { [key]: value } as a convenient way for standard config
        const config = settings.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        // Include raw settings for the advanced list
        return NextResponse.json({ config, raw: settings });
    } catch (error) {
        console.error("Error fetching Manlab settings:", error);
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

        const setting = await (prisma as any).manlabSetting.upsert({
            where: { key: data.key },
            update: { value: data.value },
            create: { key: data.key, value: data.value }
        });

        return NextResponse.json(setting);
    } catch (error) {
        console.error("Error saving Manlab setting:", error);
        return NextResponse.json({ error: "Failed to save setting" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { key } = await request.json();

        await (prisma as any).manlabSetting.delete({
            where: { key }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting setting:", error);
        return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
    }
}
