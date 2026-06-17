export default async function PrintLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="bg-white min-h-screen">
            {children}
        </div>
    );
}
