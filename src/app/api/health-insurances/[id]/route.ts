import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        const data = await request.json();
        const { propagateNBU, ...updateData } = data;

        const healthInsurance = await prisma.healthInsurance.update({
            where: { id: resolvedParams.id },
            data: {
                nombre: updateData.nombre !== undefined ? updateData.nombre : undefined,
                contado: updateData.contado !== undefined ? updateData.contado : undefined,
                cortada: updateData.cortada !== undefined ? updateData.cortada : undefined,
                valorNBU: updateData.valorNBU !== undefined ? updateData.valorNBU : undefined,
                selectorRTR: updateData.selectorRTR !== undefined ? updateData.selectorRTR : undefined,
                codigoExterno: updateData.codigoExterno !== undefined ? updateData.codigoExterno : undefined,
            },
        });

        // Propagate NBU to all determination prices if requested
        if (propagateNBU && updateData.valorNBU !== undefined) {
            const newNbuValue = parseFloat(updateData.valorNBU);
            
            // Optimization: Use raw SQL to update all prices in a single operation
            // This is much faster than fetching all records and updating them one by one
            await prisma.$executeRaw`
                UPDATE prices_os_config 
                SET precio = (COALESCE(cantidad_nbu, 0) * ${newNbuValue}) + COALESCE(monto_fijo, 0),
                    updated_at = NOW()
                WHERE health_insurance_id = ${resolvedParams.id}
            `;
        }

        return NextResponse.json(healthInsurance);
    } catch (error: any) {
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Ya existe una obra social con este nombre para este laboratorio." }, { status: 400 });
        }
        return NextResponse.json({ error: "Error al actualizar la obra social" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const resolvedParams = await params;
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

        await prisma.healthInsurance.delete({
            where: { id: resolvedParams.id },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        return NextResponse.json({ error: "Error al eliminar obra social" }, { status: 500 });
    }
}
