interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  variant?: "full" | "icon";
}

export default function Logo({
  className = "",
  size = "md",
  variant = "full",
}: LogoProps) {
  const sizes = {
    sm: { icon: 28, text: "text-sm", sub: "text-[9px]", gap: "gap-1.5" },
    md: { icon: 36, text: "text-base", sub: "text-[10px]", gap: "gap-2" },
    lg: { icon: 48, text: "text-xl", sub: "text-xs", gap: "gap-2.5" },
  };

  const s = sizes[size];

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      {/* Library building icon based on the actual Commerce PL branding */}
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Background */}
        <rect width="48" height="48" rx="10" fill="#1D9E75" />
        {/* Building facade - Historic Post Office style */}
        {/* Pediment/triangle roof */}
        <path d="M12 20L24 11L36 20H12Z" fill="white" />
        {/* Columns */}
        <rect x="15" y="20" width="2.5" height="12" fill="white" opacity="0.95" />
        <rect x="20.5" y="20" width="2.5" height="12" fill="white" opacity="0.95" />
        <rect x="25" y="20" width="2.5" height="12" fill="white" opacity="0.95" />
        <rect x="30.5" y="20" width="2.5" height="12" fill="white" opacity="0.95" />
        {/* Door arch */}
        <path d="M21.5 32V27a2.5 2.5 0 015 0v5" fill="white" opacity="0.6" />
        {/* Base/steps */}
        <rect x="12" y="32" width="24" height="2" rx="0.5" fill="white" />
        <rect x="13" y="34" width="22" height="1.5" rx="0.5" fill="white" opacity="0.7" />
        {/* Star */}
        <path d="M24 38l-1.2-0.9-1.5 0.3 0.5-1.4-0.9-1.2h1.5L24 33.5l.6 1.3h1.5l-.9 1.2.5 1.4-1.5-.3L24 38z" fill="white" opacity="0.8" />
      </svg>
      {variant === "full" && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-serif font-bold tracking-wide ${s.text}`}
            style={{ color: "#8B8B3A", fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            commerce
          </span>
          <span
            className={`font-medium tracking-[0.2em] uppercase ${s.sub}`}
            style={{ color: "#8B8B3A", fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            public &#9733; library
          </span>
        </div>
      )}
    </div>
  );
}
