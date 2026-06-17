import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/login");
    }

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950">
            <Sidebar />
            <main className="flex-1 overflow-y-auto w-full md:w-auto">
                {children}
            </main>
        </div>
    );
}
