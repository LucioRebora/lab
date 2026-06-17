import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const audit = await createAuditLog(body);
        return NextResponse.json(audit || { skipped: true });
    } catch (error) {
        console.error("Audit log error:", error);
        return NextResponse.json({ error: "Failed to log" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const labId = searchParams.get("laboratoryId");

        const logs = await (prisma as any).auditLog.findMany({
            where: labId ? { laboratoryId: labId } : {},
            orderBy: { createdAt: "desc" },
            take: 100,
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error("Audit fetch error:", error);
        return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
    }
}
