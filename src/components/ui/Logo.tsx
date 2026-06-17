// Logo SVG de bioitia - para usar como componente React

export function BioitiaLogo({
    size = 32,
    className = "",
}: {
    size?: number;
    className?: string;
}) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* Hexágono de fondo */}
            <path
                d="M16 2L28 9V23L16 30L4 23V9L16 2Z"
                fill="currentColor"
                fillOpacity="0.08"
                stroke="currentColor"
                strokeWidth="1.5"
            />
            {/* Cruz médica simplificada + círculo central */}
            <rect x="14.5" y="9" width="3" height="14" rx="1.5" fill="currentColor" />
            <rect x="9" y="14.5" width="14" height="3" rx="1.5" fill="currentColor" />
            <circle cx="16" cy="16" r="3" fill="currentColor" fillOpacity="0.15" />
        </svg>
    );
}

// Wordmark completo con ícono
export function BioitiaWordmark({
    className = "",
}: {
    className?: string;
}) {
    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            <BioitiaLogo size={28} />
            <span className="font-bold text-xl tracking-tight">
                bio.itia
            </span>
        </div>
    );
}
