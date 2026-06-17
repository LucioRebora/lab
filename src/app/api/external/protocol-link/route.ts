import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SignJWT } from "jose";

export const dynamic = "force-dynamic";

/**
 * API para integraciones externas - Generación de JWT para Redirección Segura
 * GET /api/external/protocol-link?numeroSecuencial=YYYYMMDDXXXX
 * Headers: X-API-KEY: {BIOITIA_API_KEY}
 */
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const numeroSecuencial = searchParams.get("numeroSecuencial");
        
        // Extraer laboratorio y key preferentemente de los headers
        const laboratoryId = req.headers.get("X-LABORATORY-ID") || req.headers.get("X-LAB-ID") || searchParams.get("laboratoryId") || searchParams.get("labId");
        const apiKey = req.headers.get("X-API-KEY") || searchParams.get("key");

        const VALID_API_KEY = process.env.BIOITIA_API_KEY;

        if (!apiKey || apiKey.trim() !== VALID_API_KEY?.trim()) {
            return NextResponse.json({ error: "No autorizado. Verifique la API Key." }, { status: 401 });
        }

        if (!numeroSecuencial) {
            return NextResponse.json({ error: "Se requiere el parámetro 'numeroSecuencial'." }, { status: 400 });
        }

        const where: any = { numeroSecuencial: String(numeroSecuencial) };
        if (laboratoryId) {
            where.laboratoryId = laboratoryId;
        }

        const protocol = await (prisma as any).protocol.findFirst({
            where: where,
            select: { id: true, laboratoryId: true, numeroSecuencial: true }
        });

        if (!protocol) {
            return NextResponse.json({ error: "Protocolo no encontrado." }, { status: 404 });
        }

        // GENERACIÓN DE JWT (Seguro, del lado del servidor)
        // Usamos la API KEY como secreto para la firma (mínimo 32 caracteres recomendados)
        const secret = new TextEncoder().encode(VALID_API_KEY);
        
        const token = await new SignJWT({ 
            protocolId: protocol.id,
            numeroSecuencial: protocol.numeroSecuencial,
            laboratoryId: protocol.laboratoryId
        })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("5m") // Expira en 5 minutos
        .sign(secret);

        const baseUrl = process.env.NEXTAUTH_URL || "https://bio.itia.ar";
        
        // URL de impresión con el auth_token (JWT)
        const securePrintUrl = `${baseUrl}/admin/protocolos/${protocol.id}/print?auth_token=${token}`;

        return NextResponse.json({ 
            success: true,
            numeroSecuencial: protocol.numeroSecuencial,
            protocolId: protocol.id,
            token: token,
            url: securePrintUrl
        });
    } catch (error) {
        console.error("Error en API externa de enlace:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
