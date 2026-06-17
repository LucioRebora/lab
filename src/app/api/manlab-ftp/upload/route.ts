import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import * as ftp from "basic-ftp";
import { Readable } from "stream";

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { exportId } = await request.json();

        if (!exportId) {
            return NextResponse.json({ error: "Export ID is required" }, { status: 400 });
        }

        // 1. Get Export Details
        const cleanExportId = exportId.trim();
        const manlabExport = await (prisma as any).manlabExport.findUnique({
            where: { id: cleanExportId }
        });

        if (!manlabExport) {
            console.error(`[FTP] Export record not found in DB for ID: ${cleanExportId}`);
            return NextResponse.json({ error: "Export not found" }, { status: 404 });
        }

        // 2. Get associated ManlabOrders to reconstruct file
        const orders = await (prisma as any).manlabOrder.findMany({
            where: {
                resultId: { in: manlabExport.resultIds as string[] }
            }
        });

        // 3. Reconstruct TXT content
        let txtContent = "";
        const cleanStr = (str: any) => (str || "").toString().trim();

        orders.forEach((o: any) => {
            const line = [
                cleanStr(o.barcode),
                cleanStr(o.rotulo),
                cleanStr(manlabExport.cliente), 
                cleanStr(o.codPrestacion),
                cleanStr(o.iva),
                cleanStr(o.comentario),
                cleanStr(o.diuresis?.toString().replace('.', ',')),
                cleanStr(o.tipoDocumento),
                cleanStr(o.numeroDocumento)
            ].join(";");
            txtContent += line + "\n";
        });

        // 4. Get FTP settings
        const settingsRaw = await (prisma as any).manlabSetting.findMany();
        const settings = settingsRaw.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        const ftpUrl = settings.ftp_url;
        const ftpUser = settings.ftp_user;
        const ftpPass = settings.ftp_pass;

        if (!ftpUrl || !ftpUser || !ftpPass) {
            return NextResponse.json({ error: "FTP configuration missing" }, { status: 500 });
        }

        // 5. Upload via FTP
        const client = new ftp.Client();
        // client.ftp.verbose = true;

        try {
            await client.access({
                host: ftpUrl,
                user: ftpUser,
                password: ftpPass,
                secure: false 
            });

            // Convert string to stream for basic-ftp
            const stream = Readable.from([txtContent]);
            await client.uploadFrom(stream, manlabExport.filename);
            
            // 6. Update status in database using raw query to bypass stale client validation
            console.log(`[FTP] Attempting to mark export ${cleanExportId} as SENT...`);
            const rowsSent = await prisma.$executeRaw`UPDATE manlab_export SET status = 'SENT', updated_at = NOW() WHERE id = ${cleanExportId}`;
            console.log(`[FTP] SENT Update result: ${rowsSent} rows affected`);

            return NextResponse.json({ success: true });
        } catch (ftpError: any) {
            console.error(`[FTP] ERROR in upload process: ${ftpError.message}`);
            
            // 6. Update status to FAILED using raw query
            try {
                console.log(`[FTP] Attempting to mark export ${cleanExportId} as FAILED due to error...`);
                const rowsFailed = await prisma.$executeRaw`UPDATE manlab_export SET status = 'FAILED', updated_at = NOW() WHERE id = ${cleanExportId}`;
                console.log(`[FTP] FAILED Status update result: ${rowsFailed} rows affected`);
            } catch (dbErr: any) {
                console.error("[FTP] ERROR updating status to FAILED in DB:", dbErr.message);
            }

            return NextResponse.json({ error: "FTP Upload failed: " + ftpError.message }, { status: 500 });
        } finally {
            client.close();
        }

    } catch (error: any) {
        console.error("Error in Manlab FTP upload:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
